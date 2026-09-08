import { describe, it, expect, afterEach, vi } from "vitest";
import { fetchWithTimeout, FetchTimeoutError, WP_FETCH_TIMEOUT_MS } from "@/lib/api/fetch-timeout";
import { serverFetch, ServerFetchError } from "@/lib/api/server";

/**
 * These cover the failure mode that took a production deploy down: a WordPress
 * request that never answers spends the whole `staticPageGenerationTimeout`
 * budget, and after the retries Next exits the build. Every server caller
 * already degrades on a *thrown* error, so the contract under test is that a
 * stall becomes a throw quickly rather than a hang.
 */
describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches an abort signal to every request", async () => {
    const spy = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      async () => new Response("{}", { status: 200 }),
    );
    vi.stubGlobal("fetch", spy);

    await fetchWithTimeout("http://localhost/wp-json/x");

    const init = spy.mock.calls[0][1]!;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("preserves the caller's Next cache options alongside the signal", async () => {
    const spy = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      async () => new Response("{}", { status: 200 }),
    );
    vi.stubGlobal("fetch", spy);

    await fetchWithTimeout("http://localhost/wp-json/x", {
      next: { revalidate: 300, tags: ["blog:posts"] },
    });

    const init = spy.mock.calls[0][1]!;
    expect(init.next).toEqual({ revalidate: 300, tags: ["blog:posts"] });
  });

  it("converts an abort into FetchTimeoutError naming the URL and the ceiling", async () => {
    vi.stubGlobal("fetch", async () => {
      throw Object.assign(new Error("aborted"), { name: "TimeoutError" });
    });

    await expect(fetchWithTimeout("http://localhost/wp-json/slow")).rejects.toThrow(
      FetchTimeoutError,
    );
    await expect(fetchWithTimeout("http://localhost/wp-json/slow")).rejects.toThrow(
      String(WP_FETCH_TIMEOUT_MS),
    );
  });

  it("rethrows a non-abort transport error untouched", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });

    await expect(fetchWithTimeout("http://localhost/wp-json/x")).rejects.toThrow(TypeError);
  });
});

describe("serverFetch transport failures", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("surfaces a timeout as a 504 ServerFetchError so callers' catch paths run", async () => {
    vi.stubGlobal("fetch", async () => {
      throw Object.assign(new Error("aborted"), { name: "TimeoutError" });
    });

    const error = await serverFetch("/lms-backend/v1/home").catch((e) => e);

    expect(error).toBeInstanceOf(ServerFetchError);
    expect((error as ServerFetchError).status).toBe(504);
    expect((error as ServerFetchError).code).toBe("fetch_timeout");
  });

  it("surfaces a network error as a 502 ServerFetchError", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });

    const error = await serverFetch("/lms-backend/v1/home").catch((e) => e);

    expect(error).toBeInstanceOf(ServerFetchError);
    expect((error as ServerFetchError).status).toBe(502);
    expect((error as ServerFetchError).code).toBe("fetch_network_error");
  });
});
