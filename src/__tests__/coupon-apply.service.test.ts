import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";
import { certificateService } from "@/lib/services/certificate";
import { CouponError, formsService } from "@/lib/services/forms";

/**
 * Applying a coupon is the one place the app must NOT have an opinion: Gravity
 * Forms decides validity, and its refusal text is the only thing that tells a
 * buyer whether retyping would help. These tests pin that a refusal keeps its
 * wording, and that a transport failure is never dressed up as one.
 */

const post = vi.fn();

vi.mock("@/lib/api/client", () => ({
  api: {
    get: vi.fn(),
    post: (...args: unknown[]) => post(...args),
  },
}));

/** A WP_Error body as the plugin returns it, wrapped the way Axios rejects. */
function wpError(status: number, code: string, message: string, data: object = {}): AxiosError {
  const headers = new AxiosHeaders();
  const response = {
    status,
    statusText: "",
    headers,
    config: { headers },
    data: { code, message, data: { status, ...data } },
  } as AxiosResponse;
  return new AxiosError(message, String(status), response.config, undefined, response);
}

beforeEach(() => {
  post.mockReset();
});

describe("formsService.applyCoupon", () => {
  it("posts the code and the codes already applied, and returns the accepted coupon", async () => {
    post.mockResolvedValue({
      data: {
        coupon: { code: "SAVE10", name: "Ten off", type: "flat", amount: 10 },
        applied: ["WELCOME", "SAVE10"],
        field: { id: 73, name: "input_73" },
        totals: null,
      },
    });

    const result = await formsService.applyCoupon(4, { code: "SAVE10", applied: ["WELCOME"] });

    expect(result.applied).toEqual(["WELCOME", "SAVE10"]);

    const [path, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    // Same-origin BFF route, not the CMS: the browser cannot write cross-origin.
    expect(path).toBe("/api/forms/4/coupons");
    expect(body.code).toBe("SAVE10");
    // Stacking is judged server-side, so the existing codes have to go up with it.
    expect(body.applied).toEqual(["WELCOME"]);
  });

  it("sends a selection only when one is supplied, and never a total", async () => {
    post.mockResolvedValue({ data: { coupon: {}, applied: [], field: {}, totals: null } });

    await formsService.applyCoupon(4, {
      code: "SAVE10",
      selection: { products: { "51": { choice: "Both", qty: 2 } }, shipping: "UK" },
    });

    const [, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(body.selection).toEqual({
      products: { "51": { choice: "Both", qty: 2 } },
      shipping: "UK",
    });
    expect(JSON.stringify(body)).not.toContain("total");
  });

  it("omits the selection key entirely when none is given", async () => {
    post.mockResolvedValue({ data: { coupon: {}, applied: [], field: {}, totals: null } });

    await formsService.applyCoupon(4, { code: "SAVE10" });

    const [, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(body).not.toHaveProperty("selection");
  });

  it("turns a 422 into a CouponError carrying the backend's own wording", async () => {
    post.mockRejectedValue(
      wpError(422, "lms_coupon_invalid", "This coupon has expired.", { code: "SAVE10" }),
    );

    await expect(formsService.applyCoupon(4, { code: "SAVE10" })).rejects.toMatchObject({
      name: "CouponError",
      // Not "Invalid coupon" or any paraphrase — the buyer needs to know retyping
      // will not help.
      message: "This coupon has expired.",
      code: "SAVE10",
    });
  });

  it("keeps the stacking refusal's wording, decoded for display", async () => {
    // Exactly what the live add-on returns — Gravity Forms escapes its own
    // strings, so the apostrophe arrives as an entity. Verified against
    // gravityformscoupons on the local site.
    post.mockRejectedValue(
      wpError(
        422,
        "lms_coupon_invalid",
        "This coupon can&#039;t be used in conjunction with other coupons you have already entered.",
      ),
    );

    const err = await formsService.applyCoupon(4, { code: "SOLO" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(CouponError);
    expect((err as CouponError).message).toBe(
      "This coupon can't be used in conjunction with other coupons you have already entered.",
    );
  });

  it("leaves a rate limit as an ApiError, not a refused coupon", async () => {
    post.mockRejectedValue(
      wpError(429, "lms_coupon_rate_limited", "Too many coupon attempts. Please try again later."),
    );

    const err = await formsService.applyCoupon(4, { code: "SAVE10" }).catch((e: unknown) => e);
    // Telling a buyer their code is invalid when the server only throttled them
    // sends them off to find another code that will not work either.
    expect(err).toBeInstanceOf(ApiError);
    expect(err).not.toBeInstanceOf(CouponError);
  });

  it("leaves an inactive add-on as an ApiError", async () => {
    post.mockRejectedValue(wpError(503, "lms_coupons_unavailable", "Coupons are not available."));

    const err = await formsService.applyCoupon(4, { code: "SAVE10" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).not.toBeInstanceOf(CouponError);
  });
});

describe("certificateService.createIntent", () => {
  it("sends the applied codes, so the PaymentIntent is priced with them", async () => {
    // Typed params so the captured call is indexable; the response is what the
    // BFF intent route returns.
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      Response.json({ client_secret: "cs_1", payment_intent_id: "pi_1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await certificateService.createIntent({
      selection: {
        products: { "51": { choice: "Both", qty: 1 } },
        shipping: null,
        coupons: ["SAVE10"],
      },
      fields: {},
      contact: { email: "a@b.test", name: "A B" },
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as Record<string, unknown>;
    // Without this the buyer is charged the pre-coupon total for an order the UI
    // showed discounted — and the recorded entry disagrees with the charge.
    expect(body.coupons).toEqual(["SAVE10"]);

    vi.unstubAllGlobals();
  });

  it("sends an empty list when no code was applied", async () => {
    // Typed params so the captured call is indexable; the response is what the
    // BFF intent route returns.
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      Response.json({ client_secret: "cs_1", payment_intent_id: "pi_1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await certificateService.createIntent({
      selection: { products: {}, shipping: null },
      fields: {},
      contact: { email: "a@b.test", name: "" },
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as Record<string, unknown>;
    expect(body.coupons).toEqual([]);

    vi.unstubAllGlobals();
  });
});
