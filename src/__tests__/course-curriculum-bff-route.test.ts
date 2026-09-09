import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyToWP = vi.fn(async (_path: string, _options?: unknown) => new Response(null));
vi.mock("@/lib/api/bff", () => ({
  proxyToWP: (path: string, options?: unknown) => proxyToWP(path, options),
}));

const { GET } = await import("@/app/api/courses/[id]/curriculum/route");

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => proxyToWP.mockClear());

describe("GET /api/courses/[id]/curriculum", () => {
  it("sends a numeric id to the by-id upstream path", async () => {
    await GET(new Request("https://x.test/api/courses/79024/curriculum"), ctx("79024"));
    expect(proxyToWP).toHaveBeenCalledWith("/courses/79024/curriculum", { requiresAuth: false });
  });

  it("sends a slug to the by-slug upstream path", async () => {
    await GET(new Request("https://x.test/api/courses/fire-warden/curriculum"), ctx("fire-warden"));
    expect(proxyToWP).toHaveBeenCalledWith("/courses/slug/fire-warden/curriculum", {
      requiresAuth: false,
    });
  });

  it("encodes a slug that contains URL-significant characters", async () => {
    await GET(new Request("https://x.test/api/courses/a%2Fb/curriculum"), ctx("a/b"));
    expect(proxyToWP).toHaveBeenCalledWith("/courses/slug/a%2Fb/curriculum", {
      requiresAuth: false,
    });
  });

  it("rejects a blank id with 400 and never reaches WordPress", async () => {
    const res = await GET(new Request("https://x.test/api/courses//curriculum"), ctx("  "));
    expect(res.status).toBe(400);
    expect(proxyToWP).not.toHaveBeenCalled();
  });
});
