import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The browser must never be handed the CMS origin as a base URL — that is the
 * whole cross-origin CORS failure this proxy exists to remove. The server must
 * never be handed the relative one, which Node's fetch cannot resolve.
 */

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("Axios base URL", () => {
  it("points at the same-origin read proxy in the browser", async () => {
    // jsdom is the default environment, so `window` is already defined here.
    const { api } = await import("@/lib/api/client");

    expect(api.defaults.baseURL).toBe("/api/wp");
  });

  it("points at the CMS origin on the server", async () => {
    vi.resetModules();
    vi.stubGlobal("window", undefined);

    const { api } = await import("@/lib/api/client");
    const { WP_REST_BASE } = await import("@/lib/env");

    expect(api.defaults.baseURL).toBe(WP_REST_BASE);
    expect(api.defaults.baseURL).toMatch(/^https?:\/\//);
  });

  it("composes a namespaced endpoint into the path the proxy route expects", async () => {
    const { api } = await import("@/lib/api/client");
    const { endpoints } = await import("@/lib/api/endpoints");

    // The namespace lives in the endpoint string, which is why flipping the
    // base URL needs no service changes.
    expect(`${api.defaults.baseURL}${endpoints.courses.popular}`).toBe(
      "/api/wp/lms-backend/v1/courses/popular",
    );
  });
});
