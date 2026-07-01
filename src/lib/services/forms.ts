import type { AxiosRequestConfig } from "axios";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { toApiError } from "@/lib/api/error";
import type { WpError } from "@/types/api";
import type { FormFieldErrors, FormSubmissionSuccess, FormValues, GravityForm } from "@/types/form";

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
      await api.post(endpoints.forms.validate(id), body, config);
      return true;
    } catch (err) {
      throw mapSubmitError(err);
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
        endpoints.forms.submit(id),
        body,
        config,
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
