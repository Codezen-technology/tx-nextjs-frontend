import { beforeEach, describe, expect, it, vi } from "vitest";
import { botChallenge, cookieJar, cookieStore, json, resetBffMocks } from "./helpers/bff-harness";

/**
 * The same-origin read proxy that every browser WordPress read goes through.
 * See `src/app/api/wp/[...path]/route.ts` for why it exists.
 */

vi.mock("next/headers", () => ({ cookies: async () => cookieStore() }));

const { GET, READ_NAMESPACES } = await import("@/app/api/wp/[...path]/route");
const { endpoints, REST_NAMESPACES } = await import("@/lib/api/endpoints");

/** Drive the route the way Next does: decoded path segments plus the raw URL. */
function call(path: string[], query = "") {
  const url = `https://front.test/api/wp/${path.join("/")}${query}`;
  return GET(new Request(url), { params: Promise.resolve({ path }) });
}

/** The upstream URL the route asked `proxyToWP` to fetch. */
function fetchedUrl(mock: ReturnType<typeof vi.fn>, callIndex = 0): string {
  return String(mock.mock.calls[callIndex][0]);
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = resetBffMocks();
});

describe("GET /api/wp — refusals happen before any upstream call", () => {
  it("refuses a namespace outside the allowlist", async () => {
    const res = await call(["wc", "store", "v1", "cart"]);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "unsupported_namespace" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an invented namespace", async () => {
    const res = await call(["evil", "v1", "anything"]);

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a namespace with no resource path beneath it", async () => {
    const res = await call(["lms-backend", "v1"]);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "missing_path" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("exposes no handler for a non-GET method", async () => {
    const route = await import("@/app/api/wp/[...path]/route");

    // A method with no exported handler is a 405 from Next itself, which is why
    // the route must never grow a POST/PUT/DELETE export.
    expect(route).not.toHaveProperty("POST");
    expect(route).not.toHaveProperty("PUT");
    expect(route).not.toHaveProperty("PATCH");
    expect(route).not.toHaveProperty("DELETE");
  });
});

describe("GET /api/wp — the allowlist cannot be escaped by path traversal", () => {
  // `encodeURIComponent` leaves `..` untouched and the upstream URL is built by
  // concatenation, so without an explicit check `fetch`'s URL parsing resolves
  // the dot segments and lands on a namespace the allowlist excluded.
  it("refuses a traversal that would reach the WooCommerce namespace", async () => {
    const res = await call(["lms-backend", "v1", "..", "..", "wc", "v3", "orders"]);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "invalid_path" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a single traversal segment anywhere in the path", async () => {
    const res = await call(["lms-backend", "v1", "courses", "..", "settings"]);

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a single-dot segment", async () => {
    const res = await call(["lms-backend", "v1", ".", "settings"]);

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an empty segment, which collapses on the way upstream", async () => {
    const res = await call(["lms-backend", "v1", "", "settings"]);

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never lets an upstream URL resolve outside its own namespace", async () => {
    // Belt and braces on the rule above: whatever the route does build must
    // still address the namespace it approved once a URL parser has had it.
    fetchMock.mockResolvedValueOnce(json({ success: true, data: {} }));
    await call(["lms-backend", "v1", "courses", "popular"]);

    expect(new URL(fetchedUrl(fetchMock)).pathname).toContain("/lms-backend/v1/");
  });
});

describe("GET /api/wp — forwarding", () => {
  it("forwards the path and query string intact", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: [{ id: 1 }] }));

    const res = await call(["lms-backend", "v1", "courses", "popular"], "?per_page=3&page=1");

    expect(res.status).toBe(200);
    expect(fetchedUrl(fetchMock)).toContain("/lms-backend/v1/courses/popular?per_page=3&page=1");
  });

  it("rebuilds a path segment that arrived percent-decoded", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: null }));

    await call(["lms-backend", "v1", "courses", "slug", "first aid & safety"]);

    expect(fetchedUrl(fetchMock)).toContain("first%20aid%20%26%20safety");
  });

  it("passes pagination totals through to the caller", async () => {
    fetchMock.mockResolvedValueOnce(
      json([{ id: 1 }], 200, { "x-wp-total": "42", "x-wp-totalpages": "4" }),
    );

    const res = await call(["wp", "v2", "posts"], "?per_page=10");

    expect(res.headers.get("x-wp-total")).toBe("42");
    expect(res.headers.get("x-wp-totalpages")).toBe("4");
  });

  it("reads the legacy certificate namespace", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: { valid: true } }));

    const res = await call(["swca", "v1", "get-certificate"], "?id=123");

    expect(res.status).toBe(200);
    expect(fetchedUrl(fetchMock)).toContain("/swca/v1/get-certificate?id=123");
  });

  it("unwraps the success envelope exactly once", async () => {
    // `proxyToWP` strips `{ success, data }`; the Axios interceptor then sees no
    // `success` key and passes the body through. A payload that itself carries a
    // top-level `success` field must survive that second pass unchanged.
    fetchMock.mockResolvedValueOnce(json({ success: true, data: { success: "yes", id: 7 } }));

    const res = await call(["lms-backend", "v1", "settings"]);

    await expect(res.json()).resolves.toEqual({ success: "yes", id: 7 });
  });
});

describe("GET /api/wp — credentials", () => {
  it("reads public content with no credential when signed out", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: { tiers: [] } }));

    const res = await call(["lms-backend", "v1", "bulk-discount-tiers"]);

    expect(res.status).toBe(200);
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("presents a signed-in visitor's token", async () => {
    cookieJar.set("access_token", "good-token");
    fetchMock.mockResolvedValueOnce(json({ success: true, data: { tiers: [] } }));

    await call(["lms-backend", "v1", "bulk-discount-tiers"]);

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer good-token");
  });

  it("serves the public response when the session expired and refresh failed", async () => {
    cookieJar.set("access_token", "expired");
    cookieJar.set("refresh_token", "stale");

    fetchMock
      .mockResolvedValueOnce(json({ code: "jwt_auth_invalid_token" }, 401))
      .mockResolvedValueOnce(json({ success: false }, 401))
      .mockResolvedValueOnce(json({ success: true, data: { tiers: [{ min: 5 }] } }));

    const res = await call(["lms-backend", "v1", "bulk-discount-tiers"]);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ tiers: [{ min: 5 }] });
    const retryHeaders = fetchMock.mock.calls[2][1].headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBeUndefined();
  });

  it("never puts the credential in the response", async () => {
    cookieJar.set("access_token", "super-secret-token");
    fetchMock.mockResolvedValueOnce(json({ success: true, data: { ok: true } }));

    const res = await call(["lms-backend", "v1", "settings"]);

    const body = await res.text();
    expect(body).not.toContain("super-secret-token");
    for (const [, value] of res.headers) {
      expect(value).not.toContain("super-secret-token");
    }
  });
});

describe("GET /api/wp — caching", () => {
  const SHAREABLE = "public, s-maxage=300, stale-while-revalidate=600";

  it("lets a successful credential-free read be shared, keyed on cookie", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: [] }));

    const res = await call(["lms-backend", "v1", "courses", "popular"]);

    expect(res.headers.get("Cache-Control")).toBe(SHAREABLE);
    expect(res.headers.get("Vary")).toBe("Cookie");
  });

  it("never stores a read made with a credential", async () => {
    cookieJar.set("access_token", "good-token");
    fetchMock.mockResolvedValueOnce(json({ success: true, data: [] }));

    const res = await call(["lms-backend", "v1", "courses", "popular"]);

    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("Vary")).toBe("Cookie");
  });

  it("never shares a bot-protection challenge", async () => {
    // The challenge surfaces as a 502. Caching it publicly would serve one bad
    // moment at the CMS to every visitor for the next five minutes.
    fetchMock.mockResolvedValueOnce(botChallenge());

    const res = await call(["lms-backend", "v1", "settings"]);

    expect(res.status).toBe(502);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("never shares an upstream client error", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: false, message: "Gone" }, 404));

    const res = await call(["lms-backend", "v1", "courses", "999999"]);

    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("never shares an upstream server error", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: false, message: "Boom" }, 503));

    const res = await call(["lms-backend", "v1", "settings"]);

    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });
});

describe("namespace allowlist tracks endpoints.ts", () => {
  /** Every literal path string in the registry. */
  function pathsIn(node: unknown, found = new Set<string>()): Set<string> {
    if (typeof node === "string") {
      if (node.startsWith("/")) found.add(node);
      return found;
    }
    if (typeof node === "function") return found;
    if (node && typeof node === "object") {
      for (const value of Object.values(node)) pathsIn(value, found);
    }
    return found;
  }

  /**
   * Namespaces deliberately kept off the read proxy because they have their own
   * BFF routes carrying Cart-Token and Basic auth. Hardcoded on purpose: this
   * list plus the allowlist must account for every namespace in the registry,
   * so a new one fails here until somebody classifies it.
   */
  const HAS_DEDICATED_ROUTE = ["wc/store/v1", "wc/v3"];

  it("classifies every namespace the endpoint registry declares", () => {
    const classified = [...READ_NAMESPACES, ...HAS_DEDICATED_ROUTE];

    for (const ns of Object.values(REST_NAMESPACES)) {
      expect(classified, `${ns} is in REST_NAMESPACES but neither proxied nor routed`).toContain(
        ns,
      );
    }
  });

  it("classifies the namespace of every endpoint path in the registry", () => {
    // Catches a namespace hardcoded into an endpoint string rather than taken
    // from REST_NAMESPACES, which the check above would miss.
    const classified = [...READ_NAMESPACES, ...HAS_DEDICATED_ROUTE];

    // `endpoints.business` is namespace-relative by design — `proxyToB2B`
    // prepends the namespace — so those paths carry none to classify.
    const { business: _b2b, ...namespaced } = endpoints;

    for (const path of pathsIn(namespaced)) {
      const namespace = classified.find((ns) => path.startsWith(`/${ns}/`));
      expect(
        namespace,
        `endpoints.ts emits ${path}, whose namespace nothing handles`,
      ).toBeDefined();
    }
  });

  it("allows each read namespace through the route", async () => {
    for (const ns of READ_NAMESPACES) {
      fetchMock.mockResolvedValueOnce(json({ success: true, data: {} }));
      const res = await call([...ns.split("/"), "probe"]);
      expect(res.status, `${ns} should be allowed`).toBe(200);
    }
  });

  it("refuses the namespaces that have their own routes", async () => {
    for (const ns of HAS_DEDICATED_ROUTE) {
      const res = await call([...ns.split("/"), "probe"]);
      expect(res.status, `${ns} should be refused`).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
