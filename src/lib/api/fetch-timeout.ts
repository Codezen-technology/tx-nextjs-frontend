/**
 * A hard per-request ceiling for every server-side WordPress fetch.
 *
 * Why this exists: `next build` gives each static page a fixed budget
 * (`staticPageGenerationTimeout` in next.config.mjs), kills the worker when it
 * is exceeded, retries, and after `staticGenerationRetryCount` attempts fails
 * the whole deploy:
 *
 *   Failed to build /[locale]/(marketing)/page: /en (attempt 1 of 3) because it
 *   took more than 60 seconds. Retrying again shortly.
 *   Export encountered an error on /[locale]/(marketing)/page: /en, exiting the build.
 *
 * Native `fetch` has no default timeout. One WordPress request that never
 * answers — a throttled build burst, a WAF hold, a stalled connection — spends
 * the entire page budget waiting and takes the deploy down with it, which is
 * how a backend hiccup turns into a failed production build.
 *
 * Every server-side caller in this app already degrades on a thrown error
 * (`.catch(() => null)`, `safely()`, env-var fallbacks), so bounding the wait
 * costs at most one section of one page instead of the build.
 */

/** Default ceiling. Generous enough for a cold WP page cache, far under the page budget. */
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Server-only override, in milliseconds. Set `WP_FETCH_TIMEOUT_MS` when the
 * backend is genuinely slow (a local Valet site rebuilding caches) rather than
 * raising the page budget, which only delays the same failure.
 */
export const WP_FETCH_TIMEOUT_MS = (() => {
  const raw = Number(process.env.WP_FETCH_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
})();

/** Thrown when the upstream did not answer inside the ceiling. */
export class FetchTimeoutError extends Error {
  constructor(public url: string) {
    super(`WordPress did not answer ${url} within ${WP_FETCH_TIMEOUT_MS}ms`);
    this.name = "FetchTimeoutError";
  }
}

/**
 * `fetch` with a bounded wait.
 *
 * Next's patched fetch reads and strips `signal` itself — it drops the signal
 * only on background revalidation — so passing one does not opt the request out
 * of the `next: { revalidate, tags }` cache.
 *
 * @throws FetchTimeoutError on timeout; the original error otherwise.
 */
export async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(WP_FETCH_TIMEOUT_MS) });
  } catch (error) {
    // Node throws DOMException `TimeoutError`; undici sometimes surfaces the
    // abort as `AbortError`. Both mean the ceiling was hit here, since this is
    // the only signal attached to the request.
    const name = (error as { name?: string })?.name;
    if (name === "TimeoutError" || name === "AbortError") throw new FetchTimeoutError(url);
    throw error;
  }
}
