import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookieStore, json, resetBffMocks } from "./helpers/bff-harness";

/**
 * Upload routes parse a multipart body before their auth check runs, so an
 * unparseable body used to throw and surface as a 500 with an empty response —
 * reachable by anyone, and noisy in the logs. They must answer 400 instead.
 */

vi.mock("next/headers", () => ({ cookies: async () => cookieStore() }));

const assignments = await import("@/app/api/assignments/[id]/upload/route");
const businessLogo = await import("@/app/api/business/profile/[id]/logo/route");

function jsonRequest(url: string) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

function multipartRequest(url: string) {
  const form = new FormData();
  form.set("file", "contents");
  return new Request(url, { method: "POST", body: form });
}

beforeEach(() => {
  resetBffMocks();
});

describe("POST /api/assignments/[id]/upload", () => {
  it("answers 400, not 500, for a body that is not multipart", async () => {
    const res = await assignments.POST(jsonRequest("https://f.test/api/assignments/9/upload"), {
      params: Promise.resolve({ id: "9" }),
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "invalid_body" });
  });

  it("still requires a signed-in user for a well-formed upload", async () => {
    const res = await assignments.POST(
      multipartRequest("https://f.test/api/assignments/9/upload"),
      {
        params: Promise.resolve({ id: "9" }),
      },
    );

    expect(res.status).toBe(401);
  });
});

describe("POST /api/business/profile/[id]/logo", () => {
  it("answers 400, not 500, for a body that is not multipart", async () => {
    const res = await businessLogo.POST(jsonRequest("https://f.test/api/business/profile/3/logo"), {
      params: Promise.resolve({ id: "3" }),
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "invalid_body" });
  });

  it("still requires a signed-in user for a well-formed upload", async () => {
    const res = await businessLogo.POST(
      multipartRequest("https://f.test/api/business/profile/3/logo"),
      { params: Promise.resolve({ id: "3" }) },
    );

    expect(res.status).toBe(401);
  });
});

describe("readFormData", () => {
  it("returns null rather than throwing on an unparseable body", async () => {
    const { readFormData } = await import("@/lib/api/bff");

    const bad = new Request("https://f.test/x", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    await expect(readFormData(bad)).resolves.toBeNull();
  });

  it("returns the parsed form for a multipart body", async () => {
    const { readFormData } = await import("@/lib/api/bff");

    const form = await readFormData(multipartRequest("https://f.test/x"));

    expect(form?.get("file")).toBe("contents");
  });

  it("does not consume the upstream fetch", async () => {
    // Guard against a future refactor reading the body twice.
    const fetchMock = resetBffMocks();
    fetchMock.mockResolvedValue(json({ success: true, data: {} }));

    const { readFormData } = await import("@/lib/api/bff");
    const form = await readFormData(multipartRequest("https://f.test/x"));

    expect(form).not.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
