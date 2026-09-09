import axios, { type AxiosError, type AxiosResponse } from "axios";
import { WP_REST_BASE } from "@/lib/env";
import { toApiError } from "./error";

const isBrowser = typeof window !== "undefined";

function unwrapLmsEnvelope<T>(response: AxiosResponse<T>): AxiosResponse<T> {
  const body = response.data as unknown;
  if (body && typeof body === "object" && "success" in body) {
    const envelope = body as {
      success?: boolean;
      data?: unknown;
      error?: { code?: string; message?: string };
    };
    if (envelope.success === true) {
      response.data = envelope.data as T;
      return response;
    }
    const err = envelope.error ?? { code: "unknown", message: "Request failed" };
    return Promise.reject(
      toApiError({
        response: { status: response.status, data: err },
      } as AxiosError),
    ) as unknown as AxiosResponse<T>;
  }
  return response;
}

/**
 * The browser never calls the CMS directly.
 *
 * The CMS is on another origin behind bot protection that answers unrecognised
 * callers with a challenge page — 202, `text/html`, no `Access-Control-Allow-Origin`
 * — so any cross-origin XHR to it dies as a CORS error whatever the endpoint
 * would have returned. `src/app/api/wp/[...path]/route.ts` makes the same read
 * server-side, where CORS does not apply. Do not "simplify" this back to a
 * single base URL: it silently reintroduces blank sections on live pages.
 *
 * The server branch is unchanged. Server Components share this singleton
 * (`pages.ts`, `products.ts`, `bundles.ts`) and a relative base URL would be
 * meaningless to Node's fetch. Namespaces live in the `endpoints.ts` strings,
 * so both branches compose the same path with no service changes.
 */
export const api = axios.create({
  baseURL: isBrowser ? "/api/wp" : WP_REST_BASE || "/wp-json",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.response.use(
  (response) => unwrapLmsEnvelope(response),
  (error: AxiosError) => {
    const apiErr = toApiError(error);

    if (isBrowser && (apiErr.status === 401 || apiErr.status === 403)) {
      const onAuthRoute = /^\/(login|register|forgot-password)/.test(window.location.pathname);
      if (!onAuthRoute) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.assign(`/login?next=${next}&reason=session`);
      }
    }

    return Promise.reject(apiErr);
  },
);

export type Api = typeof api;
