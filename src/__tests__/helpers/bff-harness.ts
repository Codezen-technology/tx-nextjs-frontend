import { vi } from "vitest";

/**
 * Shared fixtures for testing BFF routes and `proxyToWP`.
 *
 * The cookie jar, the `next/headers` mock and the JSON response builder were
 * copied into every route test until there were three of them. `vi.mock` is
 * hoisted and cannot be wrapped in a helper, so each test file still declares
 * its own mock — but it points at this one jar, so the jar and the response
 * builders live in a single place.
 */

/** Cookies visible to the route under test. Clear it in `beforeEach`. */
export const cookieJar = new Map<string, string>();

/** Cookie names the route deleted, in order. */
export const deletedCookies: string[] = [];

/**
 * The object `next/headers`' `cookies()` should resolve to.
 *
 * Use inside the `vi.mock` factory:
 * `vi.mock("next/headers", () => ({ cookies: async () => cookieStore() }))`
 */
export function cookieStore() {
  return {
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      deletedCookies.push(name);
      cookieJar.delete(name);
    },
  };
}

/** A JSON upstream response, optionally with extra headers such as pagination totals. */
export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * The bot-protection challenge the CMS serves to an unrecognised caller: a 202
 * carrying HTML and no CORS headers. The reason this proxy exists.
 */
export function botChallenge(): Response {
  return new Response(
    '<html><head><meta http-equiv="refresh" content="0;/.well-known/sgcaptcha/"></head></html>',
    { status: 202, headers: { "Content-Type": "text/html" } },
  );
}

/** Reset the jar and install a fresh `fetch` mock. Call from `beforeEach`. */
export function resetBffMocks(): ReturnType<typeof vi.fn> {
  cookieJar.clear();
  deletedCookies.length = 0;
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
