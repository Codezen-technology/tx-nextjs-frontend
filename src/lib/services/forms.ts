import type { AxiosRequestConfig } from "axios";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { toApiError } from "@/lib/api/error";
import { decodeEntities } from "@/lib/api/parsers";
import type { WpError } from "@/types/api";
import type {
  CouponApplyResult,
  FormFieldErrors,
  FormSubmissionSuccess,
  FormValues,
  GravityForm,
} from "@/types/form";

/**
 * The priceable half of an order, as the coupon endpoint reads it.
 *
 * Structural on purpose: the certificate flow passes its own `CertSelection`,
 * which is assignable to this, and the generic forms service stays ignorant of
 * the certificate domain — the dependency only ever points the other way.
 */
export interface CouponSelection {
  products: Record<string, { choice: string; qty: number }>;
  shipping: string | null;
}

/** Submission body: plain JSON values, or FormData when files are present. */
export type SubmitPayload = FormValues | FormData;

/** Multi-page position passed through to GFAPI. */
export interface PageArgs {
  sourcePage?: number;
  targetPage?: number;
}

/**
 * Thrown when the backend rejects a submission with per-field validation
 * messages (HTTP 422). `fieldErrors` is keyed by Gravity Forms field id.
 */
export class FormValidationError extends Error {
  constructor(
    public fieldErrors: FormFieldErrors,
    message = "Please fix the highlighted fields.",
  ) {
    super(message);
    this.name = "FormValidationError";
  }
}

/**
 * Thrown when the backend refuses a coupon code (HTTP 422).
 *
 * A refusal is an answer, not a fault: Gravity Forms knows whether a code is
 * expired, spent, or non-stackable, and `message` is its own wording for which.
 * Surfacing that verbatim is the whole point — a paraphrase would tell a buyer to
 * retype a code that will never work.
 */
export class CouponError extends Error {
  constructor(
    message: string,
    /** The code that was refused, echoed back by the backend. */
    public code?: string,
  ) {
    super(message);
    this.name = "CouponError";
  }
}

/**
 * Gravity Forms writes go through a dedicated BFF route, not the read proxy.
 *
 * The Axios base URL is the same-origin read proxy in the browser, and that
 * route is `GET`-only — a submission posted through it would 405. These two
 * paths are already app-absolute, so they override the base URL rather than
 * being appended to it.
 */
function bffFormPath(id: number | string, action: "validate" | "submissions" | "coupons"): string {
  return `/api/forms/${encodeURIComponent(String(id))}/${action}`;
}

/** Send cookies (Gravity Forms maps an entry to a signed-in user) and skip the base URL. */
function asBffRequest(config?: AxiosRequestConfig): AxiosRequestConfig {
  return { ...config, baseURL: "", withCredentials: true };
}

/** Pull `data.validation_messages` out of a WP_Error body, if present. */
function extractValidationMessages(raw: unknown): FormFieldErrors | null {
  const body = raw as WpError | undefined;
  const vm = body?.data?.validation_messages;
  if (vm && typeof vm === "object" && !Array.isArray(vm)) {
    return vm as FormFieldErrors;
  }
  return null;
}

export const formsService = {
  /** Fetch a form's renderable schema. */
  async getForm(id: number | string): Promise<GravityForm> {
    const { data } = await api.get<GravityForm>(endpoints.forms.detail(id));
    return data;
  },

  /** Dry-run validation (no entry saved). Throws FormValidationError on 422. */
  async validateForm(id: number | string, values: SubmitPayload, pages?: PageArgs): Promise<true> {
    const { body, config } = withPages(values, pages);
    try {
      await api.post(bffFormPath(id, "validate"), body, asBffRequest(config));
      return true;
    } catch (err) {
      throw mapSubmitError(err);
    }
  },

  /**
   * Apply a coupon code to a form. Throws `CouponError` when the backend refuses
   * it, `ApiError` for anything else (unreachable, rate-limited, form gone).
   *
   * `applied` carries the codes already accepted so the backend can judge stacking
   * — it is the question "may this code join these?", not "is this code real?".
   *
   * `selection` is optional and only buys server-computed totals; without it the
   * response's `totals` is null and the caller re-quotes as it normally would. No
   * total is ever sent *up*: the backend prices from the form, never from us.
   */
  async applyCoupon(
    id: number | string,
    input: { code: string; applied?: string[]; selection?: CouponSelection },
  ): Promise<CouponApplyResult> {
    try {
      const { data } = await api.post<CouponApplyResult>(
        bffFormPath(id, "coupons"),
        {
          code: input.code,
          applied: input.applied ?? [],
          ...(input.selection
            ? {
                selection: {
                  products: input.selection.products,
                  shipping: input.selection.shipping,
                },
              }
            : {}),
        },
        asBffRequest(),
      );
      return data;
    } catch (err) {
      throw mapCouponError(err);
    }
  },

  /** Submit a form. Throws FormValidationError on 422, ApiError otherwise. */
  async submitForm(
    id: number | string,
    values: SubmitPayload,
    pages?: PageArgs,
  ): Promise<FormSubmissionSuccess> {
    const { body, config } = withPages(values, pages);
    try {
      const { data } = await api.post<FormSubmissionSuccess>(
        bffFormPath(id, "submissions"),
        body,
        asBffRequest(config),
      );
      return data;
    } catch (err) {
      throw mapSubmitError(err);
    }
  },
};

/**
 * Merge multi-page position into the payload. For FormData we let the browser
 * set the multipart boundary (Content-Type: undefined removes the client's
 * default application/json).
 */
function withPages(
  payload: SubmitPayload,
  pages?: PageArgs,
): { body: SubmitPayload; config?: AxiosRequestConfig } {
  if (payload instanceof FormData) {
    if (pages?.sourcePage != null) payload.set("source_page", String(pages.sourcePage));
    if (pages?.targetPage != null) payload.set("target_page", String(pages.targetPage));
    return { body: payload, config: { headers: { "Content-Type": undefined } } };
  }

  const body: FormValues = { ...payload };
  if (pages?.sourcePage != null) body.source_page = pages.sourcePage;
  if (pages?.targetPage != null) body.target_page = pages.targetPage;
  return { body };
}

/**
 * A 422 from the coupon endpoint is a refusal carrying the reason; everything
 * else (429 rate limit, 503 add-on inactive, network) stays an `ApiError` so the
 * UI does not tell a buyer their perfectly good code was rejected.
 */
function mapCouponError(err: unknown): Error {
  const apiErr = toApiError(err);
  if (apiErr.status === 422) {
    const body = apiErr.raw as WpError | undefined;
    const refused = body?.data as { code?: unknown } | undefined;
    // Gravity Forms escapes its own strings, so a refusal arrives as
    // "This coupon can&#039;t be used…". Decoding is the display layer's job:
    // the API is right to relay the add-on's text byte for byte, and the BFF
    // proxy already decodes on the routes that pass through it.
    return new CouponError(
      decodeEntities(apiErr.message),
      typeof refused?.code === "string" ? refused.code : undefined,
    );
  }
  return apiErr;
}

function mapSubmitError(err: unknown): Error {
  const apiErr = toApiError(err);
  if (apiErr.status === 422) {
    const fieldErrors = extractValidationMessages(apiErr.raw);
    if (fieldErrors) {
      return new FormValidationError(fieldErrors);
    }
  }
  return apiErr;
}
