import { beforeEach, describe, expect, it, vi } from "vitest";
import { botChallenge, cookieStore, json, resetBffMocks } from "./helpers/bff-harness";

/**
 * `proxyToWP` must be transparent in the two respects calling code depends on:
 * pagination totals (which some list endpoints report in headers rather than in
 * the body) and error text (which the two client helpers read under different
 * keys). Both were dropped before browser reads started going through the proxy.
 */

vi.mock("next/headers", () => ({ cookies: async () => cookieStore() }));

const { proxyToWP } = await import("@/lib/api/bff");

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = resetBffMocks();
});

describe("proxyToWP — pagination headers", () => {
  it("forwards x-wp-total and x-wp-totalpages from the upstream response", async () => {
    fetchMock.mockResolvedValueOnce(
      json([{ id: 1 }], 200, { "x-wp-total": "137", "x-wp-totalpages": "12" }),
    );

    const res = await proxyToWP("/courses", { requiresAuth: false });

    expect(res.headers.get("x-wp-total")).toBe("137");
    expect(res.headers.get("x-wp-totalpages")).toBe("12");
  });

  it("forwards them alongside an unwrapped success envelope", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ success: true, data: [{ id: 1 }] }, 200, { "x-wp-total": "5" }),
    );

    const res = await proxyToWP("/courses/popular", { requiresAuth: false });

    expect(await res.json()).toEqual([{ id: 1 }]);
    expect(res.headers.get("x-wp-total")).toBe("5");
  });

  it("sets neither header when the upstream reports no totals", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: [] }));

    const res = await proxyToWP("/courses/popular", { requiresAuth: false });

    expect(res.headers.get("x-wp-total")).toBeNull();
    expect(res.headers.get("x-wp-totalpages")).toBeNull();
  });
});

describe("proxyToWP — error body shape", () => {
  it("emits one error key, with the upstream status", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ success: false, message: "Course not found", code: "lms_not_found" }, 404),
    );

    const res = await proxyToWP("/courses/999", { requiresAuth: false });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: "Course not found",
      code: "lms_not_found",
    });
  });

  it("falls back to the nested error object's message and code", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ success: false, error: { message: "Nope", code: "lms_denied" } }, 403),
    );

    const res = await proxyToWP("/courses/1", { requiresAuth: false });

    await expect(res.json()).resolves.toEqual({ error: "Nope", code: "lms_denied" });
  });

  it("returns a gateway error rather than passing an unparseable body through", async () => {
    // The challenge interstitial the CMS bot protection serves. It must never
    // reach the browser as a content response.
    fetchMock.mockResolvedValueOnce(botChallenge());

    const res = await proxyToWP("/settings", { requiresAuth: false });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: "Invalid response from WordPress" });
  });
});

describe("toApiError reads the BFF error key", () => {
  it("keeps the BFF's error text instead of Axios's generic message", async () => {
    const { toApiError } = await import("@/lib/api/error");
    const { AxiosError } = await import("axios");

    // What `proxyToWP` emits: `error`, not `message`. Reading only `message`
    // here is what silently degraded every BFF error to "Request failed".
    const err = new AxiosError("Request failed with status code 404");
    err.response = {
      status: 404,
      data: { error: "Course not found", code: "lms_not_found" },
    } as never;

    const apiErr = toApiError(err);

    expect(apiErr.message).toBe("Course not found");
    expect(apiErr.code).toBe("lms_not_found");
    expect(apiErr.status).toBe(404);
  });

  it("still prefers WordPress's own message key when present", async () => {
    const { toApiError } = await import("@/lib/api/error");
    const { AxiosError } = await import("axios");

    const err = new AxiosError("boom");
    err.response = {
      status: 403,
      data: { message: "Sorry, you are not allowed to do that.", code: "rest_forbidden" },
    } as never;

    expect(toApiError(err).message).toBe("Sorry, you are not allowed to do that.");
  });
});
