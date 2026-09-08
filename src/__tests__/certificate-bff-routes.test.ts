import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyToWP = vi.fn(async (_path: string, _options?: unknown) => new Response(null));
vi.mock("@/lib/api/bff", () => ({
  proxyToWP: (path: string, options?: unknown) => proxyToWP(path, options),
}));

const { GET: configGET } = await import("@/app/api/certificate/config/route");
const { POST: quotePOST } = await import("@/app/api/certificate/quote/route");

function req(url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method: body === undefined ? "GET" : "POST",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => proxyToWP.mockClear());

describe("GET /api/certificate/config", () => {
  it("forwards the bare upstream path when no product is given", async () => {
    await configGET(req("https://x.test/api/certificate/config"));
    expect(proxyToWP).toHaveBeenCalledWith("/certificate/config", { requiresAuth: false });
  });

  it("forwards the bare upstream path for an explicit default product", async () => {
    await configGET(req("https://x.test/api/certificate/config?product=default"));
    expect(proxyToWP).toHaveBeenCalledWith("/certificate/config", { requiresAuth: false });
  });

  it("maps a non-default product onto the plugin's scoped path", async () => {
    await configGET(req("https://x.test/api/certificate/config?product=hardcopy"));
    expect(proxyToWP).toHaveBeenCalledWith("/certificate/hardcopy/config", {
      requiresAuth: false,
    });
  });

  it("rejects an unknown product with 400 and never reaches WP", async () => {
    const res = await configGET(req("https://x.test/api/certificate/config?product=bogus"));
    expect(res.status).toBe(400);
    expect(proxyToWP).not.toHaveBeenCalled();
  });

  it("rejects an empty product rather than defaulting", async () => {
    const res = await configGET(req("https://x.test/api/certificate/config?product="));
    expect(res.status).toBe(400);
    expect(proxyToWP).not.toHaveBeenCalled();
  });
});

describe("POST /api/certificate/quote", () => {
  const selection = { products: { "69": { choice: "x", qty: 1 } }, shipping: null };

  it("defaults an omitted product to the unscoped alias", async () => {
    await quotePOST(req("https://x.test/api/certificate/quote", selection));
    expect(proxyToWP).toHaveBeenCalledWith("/certificate/quote", {
      method: "POST",
      body: selection,
      requiresAuth: false,
    });
  });

  it("puts a non-default product in the path and strips it from the body", async () => {
    // The plugin scopes pricing by path segment; the selection body it documents
    // has no product key, so forwarding one would be noise at best.
    await quotePOST(
      req("https://x.test/api/certificate/quote", { ...selection, product: "hardcopy" }),
    );
    expect(proxyToWP).toHaveBeenCalledWith("/certificate/hardcopy/quote", {
      method: "POST",
      body: selection,
      requiresAuth: false,
    });
  });

  it("rejects an unknown product with 400 and never reaches WP", async () => {
    const res = await quotePOST(
      req("https://x.test/api/certificate/quote", { ...selection, product: "22" }),
    );
    expect(res.status).toBe(400);
    expect(proxyToWP).not.toHaveBeenCalled();
  });
});
