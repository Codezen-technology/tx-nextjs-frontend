import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A public BFF read (`requiresAuth: false`) still forwards a signed-in user's
 * access token. These cover what happens when WordPress rejects that token:
 * the request must not fail for logged-in users on an endpoint that returns 200
 * for everyone else.
 */

const cookieJar = new Map<string, string>();
const deleted: string[] = [];

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
      deleted.push(name);
      cookieJar.delete(name);
    },
  }),
}));

const { proxyToWP } = await import("@/lib/api/bff");

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const CURRICULUM = { success: true, data: [{ id: 100, type: "unit", title: "Lesson 1" }] };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  cookieJar.clear();
  deleted.length = 0;
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

describe("proxyToWP on a public route with an expired token", () => {
  it("refreshes the token and retries, rather than surfacing the 401", async () => {
    cookieJar.set("access_token", "expired");
    cookieJar.set("refresh_token", "good-refresh");

    fetchMock
      .mockResolvedValueOnce(json({ code: "jwt_auth_invalid_token" }, 401))
      .mockResolvedValueOnce(json({ success: true, data: { access_token: "fresh" } }))
      .mockResolvedValueOnce(json(CURRICULUM));

    const res = await proxyToWP("/courses/79024/curriculum", { requiresAuth: false });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(CURRICULUM.data);

    const retryHeaders = fetchMock.mock.calls[2][1].headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe("Bearer fresh");
  });

  it("falls back to the anonymous response when the refresh also fails", async () => {
    cookieJar.set("access_token", "expired");
    cookieJar.set("refresh_token", "stale-refresh");

    fetchMock
      .mockResolvedValueOnce(json({ code: "jwt_auth_invalid_token" }, 401))
      .mockResolvedValueOnce(json({ success: false }, 401))
      .mockResolvedValueOnce(json(CURRICULUM));

    const res = await proxyToWP("/courses/79024/curriculum", { requiresAuth: false });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(CURRICULUM.data);

    const retryHeaders = fetchMock.mock.calls[2][1].headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBeUndefined();
    expect(deleted).toContain("access_token");
  });

  it("does not retry anonymously when the route requires auth", async () => {
    cookieJar.set("access_token", "expired");
    cookieJar.set("refresh_token", "stale-refresh");

    fetchMock
      .mockResolvedValueOnce(json({ code: "jwt_auth_invalid_token" }, 401))
      .mockResolvedValueOnce(json({ success: false }, 401));

    const res = await proxyToWP("/users/me/enrollments", { requiresAuth: true });

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("leaves a signed-out request untouched", async () => {
    fetchMock.mockResolvedValueOnce(json(CURRICULUM));

    const res = await proxyToWP("/courses/79024/curriculum", { requiresAuth: false });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});
