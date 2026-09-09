import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The same-origin read proxy that every browser WordPress read goes through.
 * See `src/app/api/wp/[...path]/route.ts` for why it exists.
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

const { GET } = await import("@/app/api/wp/[...path]/route");
const { endpoints } = await import("@/lib/api/endpoints");
const { env } = await import("@/lib/env");

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** Drive the route the way Next does: decoded path segments plus the raw URL. */
function call(path: string[], query = "", method = "GET") {
  const url = `https://front.test/api/wp/${path.join("/")}${query}`;
  return GET(new Request(url, { method }), { params: Promise.resolve({ path }) });
}

/** The upstream URL the route asked `proxyToWP` to fetch. */
function fetchedUrl(mock: ReturnType<typeof vi.fn>, callIndex = 0): string {
  return String(mock.mock.calls[callIndex][0]);
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  cookieJar.clear();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
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
  it("lets a credential-free read be shared, keyed on cookie", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: [] }));

    const res = await call(["lms-backend", "v1", "courses", "popular"]);

    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
    expect(res.headers.get("Vary")).toBe("Cookie");
  });

  it("never stores a read made with a credential", async () => {
    cookieJar.set("access_token", "good-token");
    fetchMock.mockResolvedValueOnce(json({ success: true, data: [] }));

    const res = await call(["lms-backend", "v1", "courses", "popular"]);

    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("Vary")).toBe("Cookie");
  });
});

describe("namespace allowlist tracks endpoints.ts", () => {
  /** Namespace prefix of every endpoint string the Axios client can be handed. */
  function namespacesIn(node: unknown, found = new Set<string>()): Set<string> {
    if (typeof node === "string") {
      const match = /^\/([^/]+)\/([^/]+)\//.exec(node);
      if (match) found.add(`${match[1]}/${match[2]}`);
      return found;
    }
    if (typeof node === "function") return found;
    if (node && typeof node === "object") {
      for (const value of Object.values(node)) namespacesIn(value, found);
    }
    return found;
  }

  it("allows every content namespace the endpoint registry emits", async () => {
    const emitted = [...namespacesIn(endpoints)];

    // Content namespaces the browser reads through the proxy.
    for (const ns of [env.LMS_NAMESPACE, "wp/v2", "swca/v1"]) {
      expect(emitted).toContain(ns);
      fetchMock.mockResolvedValueOnce(json({ success: true, data: {} }));
      const res = await call([...ns.split("/"), "probe"]);
      expect(res.status, `${ns} should be allowed`).toBe(200);
    }
  });

  it("refuses the commerce namespaces, which have their own routes", async () => {
    // These carry Cart-Token and Basic auth this route does not implement.
    // If one is ever needed in the browser it gets a dedicated route, not an
    // allowlist entry.
    for (const ns of ["wc/store/v1", "wc/v3"]) {
      const res = await call([...ns.split("/"), "probe"]);
      expect(res.status, `${ns} should be refused`).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
