import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("next-intl/middleware", () => ({
  default: () => () => NextResponse.next(),
}));

const { proxy } = await import("@/proxy");
const { COOKIE_FIRST, COOKIE_SESSION, decodeCookie } =
  await import("@/lib/analytics/attribution-cookies");

describe("proxy() attribution cookies", () => {
  it("stamps attribution on a public page response", () => {
    const res = proxy(new NextRequest("https://tx.test/?utm_source=newsletter&utm_medium=email"));
    const first = decodeCookie<{ utm_source: string }>(res.cookies.get(COOKIE_FIRST)?.value);
    expect(first?.utm_source).toBe("newsletter");
    expect(res.cookies.get(COOKIE_SESSION)).toBeDefined();
  });

  it("stamps attribution on the login redirect a signed-out visitor gets from a protected route", () => {
    const res = proxy(new NextRequest("https://tx.test/dashboard?utm_source=newsletter"));
    expect(res.status).toBe(307);
    expect(res.cookies.get(COOKIE_FIRST)).toBeDefined();
  });

  it("stamps attribution on the default-locale rewrite", () => {
    const res = proxy(new NextRequest("https://tx.test/course/fire-warden?utm_source=nl"));
    expect(res.cookies.get(COOKIE_SESSION)).toBeDefined();
  });

  it("still redirects a signed-in visitor away from the login page", () => {
    const req = new NextRequest("https://tx.test/login");
    req.cookies.set("user_logged_in", "1");
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard/my-learning");
  });
});
