import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { cookieJar, cookieStore, json, resetBffMocks } from "./helpers/bff-harness";
import { server } from "./mocks/server";

/**
 * Gravity Forms writes go through their own route because the read proxy is
 * GET-only. See `src/app/api/forms/[id]/[action]/route.ts`.
 */

vi.mock("next/headers", () => ({ cookies: async () => cookieStore() }));

const { POST } = await import("@/app/api/forms/[id]/[action]/route");
const { formsService, FormValidationError } = await import("@/lib/services/forms");

function post(id: string, action: string, body: BodyInit = "{}", contentType = "application/json") {
  return POST(
    new Request(`https://front.test/api/forms/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    }),
    { params: Promise.resolve({ id, action }) },
  );
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = resetBffMocks();
});

describe("POST /api/forms/[id]/[action] — refusals", () => {
  it("refuses an action outside validate and submissions", async () => {
    const res = await post("7", "entries");

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "unsupported_action" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a non-numeric form id", async () => {
    const res = await post("../settings", "validate");

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "invalid_form_id" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/forms/[id]/[action] — forwarding", () => {
  it("posts to the Gravity Forms submissions path", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: { entry_id: 5 } }));

    const res = await post("7", "submissions", JSON.stringify({ input_1: "hi" }));

    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/forms/7/submissions");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ input_1: "hi" }));
  });

  it("posts to the validate path", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: true }));

    await post("7", "validate");

    expect(String(fetchMock.mock.calls[0][0])).toContain("/forms/7/validate");
  });

  it("works signed-out and forwards a token when there is one", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: {} }));
    await post("7", "submissions");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();

    cookieJar.set("access_token", "tok");
    fetchMock.mockResolvedValueOnce(json({ success: true, data: {} }));
    await post("7", "submissions");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer tok");
  });

  it("keeps the multipart body and its boundary intact", async () => {
    const form = new FormData();
    form.set("input_1", "hello");
    fetchMock.mockResolvedValueOnce(json({ success: true, data: {} }));

    // Build a real multipart request so the boundary is generated, then let the
    // route re-read it. Rebuilding the Content-Type would break file uploads.
    const req = new Request("https://front.test/api/forms/7/submissions", {
      method: "POST",
      body: form,
    });
    const res = await POST(req, { params: Promise.resolve({ id: "7", action: "submissions" }) });

    expect(res.status).toBe(200);
    // Not `toBeInstanceOf` — undici and jsdom each have their own FormData
    // realm, so identity fails on an object that behaves correctly.
    const sent = fetchMock.mock.calls[0][1].body as FormData;
    expect(typeof sent.get).toBe("function");
    expect(sent.get("input_1")).toBe("hello");
    // The header is not reconstructed — fetch derives it from the FormData.
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBeUndefined();
  });

  it("never caches a submission", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true, data: {} }));

    const res = await post("7", "submissions");

    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });
});

describe("POST /api/forms/[id]/[action] — validation errors survive the hop", () => {
  const VALIDATION_422 = {
    code: "lms_form_validation_failed",
    message: "There was a problem with your submission.",
    data: { status: 422, validation_messages: { "1": "This field is required" } },
  };

  it("relays the 422 body verbatim", async () => {
    fetchMock.mockResolvedValueOnce(json(VALIDATION_422, 422));

    const res = await post("7", "submissions");

    expect(res.status).toBe(422);
    // Reshaping here is what would turn "fix field 1" into a generic failure.
    await expect(res.json()).resolves.toEqual(VALIDATION_422);
  });

  it("lets formsService rebuild per-field errors from it", async () => {
    // The regression this route exists to prevent: submitForm used to POST to
    // the CMS namespace path, which the GET-only read proxy answers with 405.
    // Asserting the URL here is what pins it to the write route.
    let seenUrl = "";
    server.use(
      http.post("http://localhost:3000/api/forms/7/submissions", ({ request }) => {
        seenUrl = new URL(request.url).pathname;
        return HttpResponse.json(VALIDATION_422, { status: 422 });
      }),
    );

    const err = await formsService.submitForm(7, { input_1: "" }).catch((e: unknown) => e);

    expect(seenUrl).toBe("/api/forms/7/submissions");
    expect(err).toBeInstanceOf(FormValidationError);
    expect((err as InstanceType<typeof FormValidationError>).fieldErrors).toEqual({
      "1": "This field is required",
    });
  });
});
