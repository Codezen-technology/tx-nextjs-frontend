import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (tag: string, profile: unknown) => revalidateTag(tag, profile),
}));

// Mutable so a test can take the secret away and assert the route locks itself
// rather than opening up. The route reads `env` per request, not at import.
const mockEnv = { WP_REVALIDATE_SECRET: "" };
vi.mock("@/lib/env", () => ({ env: mockEnv }));

const { POST, GET } = await import("@/app/api/revalidate/route");

const SECRET = "s3cret-value-for-tests";

function req(body: unknown, secret: string | null = SECRET): Request {
  return new Request("https://x.test/api/revalidate", {
    method: "POST",
    headers: secret === null ? {} : { "x-wp-revalidate-secret": secret },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  revalidateTag.mockClear();
  mockEnv.WP_REVALIDATE_SECRET = SECRET;
});

describe("POST /api/revalidate — purging", () => {
  it("purges each tag once and echoes what it purged", async () => {
    const res = await POST(req({ tags: ["settings", "footer"] }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      revalidated: true,
      tags: ["settings", "footer"],
    });
    expect(revalidateTag).toHaveBeenCalledTimes(2);
    expect(revalidateTag).toHaveBeenCalledWith("settings", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("footer", { expire: 0 });
  });

  it("expires immediately rather than serving stale while it revalidates", async () => {
    // `"max"` would keep showing the old page for up to a year while it
    // refreshed behind the scenes — useless to an editor who just pressed Save.
    await POST(req({ tags: ["settings"] }));
    expect(revalidateTag).toHaveBeenCalledWith("settings", { expire: 0 });
  });

  it("purges a per-entity tag", async () => {
    const res = await POST(req({ tags: ["course:first-aid:curriculum"] }));

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("course:first-aid:curriculum", { expire: 0 });
  });

  it("de-duplicates a repeated tag within one request", async () => {
    const res = await POST(req({ tags: ["settings", "settings"] }));

    await expect(res.json()).resolves.toMatchObject({ tags: ["settings"] });
    expect(revalidateTag).toHaveBeenCalledTimes(1);
  });

  it("is safe to retry — a repeated request succeeds identically", async () => {
    const first = await POST(req({ tags: ["settings"] }));
    const second = await POST(req({ tags: ["settings"] }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledTimes(2);
  });

  it("never lets its own response be cached", async () => {
    const res = await POST(req({ tags: ["settings"] }));
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});

describe("POST /api/revalidate — authentication", () => {
  it("rejects a wrong secret without purging", async () => {
    const res = await POST(req({ tags: ["settings"] }, "wrong-secret-same-len!"));

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a missing header", async () => {
    const res = await POST(req({ tags: ["settings"] }, null));

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a secret that is a prefix of the real one", async () => {
    const res = await POST(req({ tags: ["settings"] }, SECRET.slice(0, -1)));

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("locks the endpoint when the deployment has no secret configured", async () => {
    // The failure this guards: `provided !== expected` would accept an empty
    // header on a deployment that forgot the env var, i.e. it would be open to
    // anyone precisely when nobody is watching.
    mockEnv.WP_REVALIDATE_SECRET = "";

    const blank = await POST(req({ tags: ["settings"] }, ""));
    const anything = await POST(req({ tags: ["settings"] }, "anything"));

    expect(blank.status).toBe(401);
    expect(anything.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("returns a byte-identical body for every rejection reason", async () => {
    const wrong = await POST(req({ tags: ["settings"] }, "nope")).then((r) => r.text());
    const missing = await POST(req({ tags: ["settings"] }, null)).then((r) => r.text());

    mockEnv.WP_REVALIDATE_SECRET = "";
    const unconfigured = await POST(req({ tags: ["settings"] }, SECRET)).then((r) => r.text());

    expect(new Set([wrong, missing, unconfigured]).size).toBe(1);
    expect(wrong).not.toContain(SECRET);
  });

  it("checks the secret before it looks at the body", async () => {
    // A malformed body from an unauthenticated caller must still read as 401 —
    // otherwise the status code tells a prober their secret was accepted.
    const res = await POST(req("not json at all", "wrong"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/revalidate — request validation", () => {
  it("rejects a body that is not JSON", async () => {
    const res = await POST(req("<html>"));

    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a missing or empty tag list", async () => {
    expect((await POST(req({}))).status).toBe(400);
    expect((await POST(req({ tags: [] }))).status).toBe(400);
    expect((await POST(req({ tags: "settings" }))).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a non-string tag", async () => {
    const res = await POST(req({ tags: ["settings", 42] }));

    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a list over the per-request cap", async () => {
    const res = await POST(req({ tags: Array.from({ length: 21 }, () => "settings") }));

    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects an unknown tag and names it", async () => {
    const res = await POST(req({ tags: ["setting"] }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining("setting") });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("purges nothing at all when one tag of several is unknown", async () => {
    // All-or-nothing: a partial purge would let a WP-side typo hide behind a
    // 200 and go unnoticed until someone waits out a TTL.
    const res = await POST(req({ tags: ["settings", "made-up-tag"] }));

    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("/api/revalidate — method handling", () => {
  it("answers GET with 405 rather than purging or 404ing", async () => {
    const res = GET();

    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST");
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
