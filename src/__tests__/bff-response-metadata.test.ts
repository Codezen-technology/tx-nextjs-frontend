import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `proxyToWP` must be transparent in the two respects calling code depends on:
 * pagination totals (which some list endpoints report in headers rather than in
 * the body) and error text (which the two client helpers read under different
 * keys). Both were dropped before browser reads started going through the proxy.
 */

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
}));

const { proxyToWP } = await import("@/lib/api/bff");

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  cookieJar.clear();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
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
  it("emits error, message and code so both client helpers find the text", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ success: false, message: "Course not found", code: "lms_not_found" }, 404),
    );

    const res = await proxyToWP("/courses/999", { requiresAuth: false });

    expect(res.status).toBe(404);
    // `bffJson` reads `error`; `toApiError` (the Axios path) reads `message`.
    await expect(res.json()).resolves.toEqual({
      error: "Course not found",
      message: "Course not found",
      code: "lms_not_found",
    });
  });

  it("falls back to the nested error object's message and code", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ success: false, error: { message: "Nope", code: "lms_denied" } }, 403),
    );

    const res = await proxyToWP("/courses/1", { requiresAuth: false });

    await expect(res.json()).resolves.toEqual({
      error: "Nope",
      message: "Nope",
      code: "lms_denied",
    });
  });

  it("returns a gateway error rather than passing an unparseable body through", async () => {
    // This is the challenge interstitial the CMS bot protection serves: a 202
    // carrying HTML. It must never reach the browser as a content response.
    fetchMock.mockResolvedValueOnce(
      new Response(
        '<html><head><meta http-equiv="refresh" content="0;/sgcaptcha/"></head></html>',
        {
          status: 202,
          headers: { "Content-Type": "text/html" },
        },
      ),
    );

    const res = await proxyToWP("/settings", { requiresAuth: false });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: "Invalid response from WordPress" });
  });
});
