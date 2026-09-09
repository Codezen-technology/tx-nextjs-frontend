import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_FIRST,
  COOKIE_SESSION,
  applyAttributionCookies,
  decodeCookie,
  encodeCookie,
  readAttributionState,
} from "@/lib/analytics/attribution-cookies";
import type { FirstTouch, SessionTouch } from "@/lib/analytics/attribution";

function cookieValue(res: NextResponse, name: string): string {
  const value = res.cookies.get(name)?.value;
  if (!value) throw new Error(`cookie ${name} was not set`);
  return value;
}

describe("encodeCookie() / decodeCookie()", () => {
  it("round-trips an object", () => {
    const encoded = encodeCookie({ utm_source: "newsletter", session_count: 2 });
    expect(decodeCookie<{ utm_source: string; session_count: number }>(encoded)).toEqual({
      utm_source: "newsletter",
      session_count: 2,
    });
  });

  it("produces a value with no characters that need cookie escaping", () => {
    expect(encodeCookie({ a: "x=y; z" })).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns null for an absent value rather than throwing", () => {
    expect(decodeCookie(undefined)).toBeNull();
    expect(decodeCookie("")).toBeNull();
  });

  it("returns null for a corrupt value rather than throwing", () => {
    expect(decodeCookie("!!!not-base64!!!")).toBeNull();
  });
});

describe("readAttributionState()", () => {
  it("reads both cookies out of a raw Cookie header", () => {
    const first = { utm_source: "newsletter", session_count: 3 } as unknown as FirstTouch;
    const session = { utm_source: "google", session_pages: 2 } as unknown as SessionTouch;
    const header = `foo=bar; ${COOKIE_FIRST}=${encodeCookie(first)}; ${COOKIE_SESSION}=${encodeCookie(session)}`;
    const state = readAttributionState(header);
    expect(state.first?.session_count).toBe(3);
    expect(state.session?.utm_source).toBe("google");
  });

  it("returns nulls when the header is absent", () => {
    expect(readAttributionState(null)).toEqual({ first: null, session: null });
  });

  it("returns nulls when the header holds no attribution cookies", () => {
    expect(readAttributionState("access_token=abc; user_logged_in=1")).toEqual({
      first: null,
      session: null,
    });
  });
});

describe("applyAttributionCookies()", () => {
  it("sets both cookies on a first visit carrying a campaign", () => {
    const req = new NextRequest("https://tx.test/?utm_source=newsletter&utm_medium=email");
    const res = applyAttributionCookies(req, NextResponse.next());
    const first = decodeCookie<FirstTouch>(cookieValue(res, COOKIE_FIRST));
    const session = decodeCookie<SessionTouch>(cookieValue(res, COOKIE_SESSION));
    expect(first?.utm_source).toBe("newsletter");
    expect(first?.session_count).toBe(1);
    expect(session?.session_pages).toBe(1);
  });

  it("marks both cookies httpOnly and lax so browser JavaScript cannot read them", () => {
    const req = new NextRequest("https://tx.test/");
    const res = applyAttributionCookies(req, NextResponse.next());
    for (const name of [COOKIE_FIRST, COOKIE_SESSION]) {
      const c = res.cookies.get(name);
      expect(c?.httpOnly).toBe(true);
      expect(c?.sameSite).toBe("lax");
      expect(c?.secure).toBe(true);
      expect(c?.path).toBe("/");
    }
  });

  it("leaves the cookies insecure over plain http so local development still works", () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = applyAttributionCookies(req, NextResponse.next());
    expect(res.cookies.get(COOKIE_FIRST)?.secure).toBe(false);
  });

  it("preserves the original campaign in first-touch across a later visit", () => {
    const seed = applyAttributionCookies(
      new NextRequest("https://tx.test/?utm_source=newsletter&utm_medium=email"),
      NextResponse.next(),
    );
    const carried = new NextRequest("https://tx.test/?utm_source=google&utm_medium=cpc");
    carried.cookies.set(COOKIE_FIRST, cookieValue(seed, COOKIE_FIRST));

    const res = applyAttributionCookies(carried, NextResponse.next());
    expect(decodeCookie<FirstTouch>(cookieValue(res, COOKIE_FIRST))?.utm_source).toBe("newsletter");
    expect(decodeCookie<SessionTouch>(cookieValue(res, COOKIE_SESSION))?.utm_source).toBe("google");
  });

  it("increments the page count on an internal navigation within a live session", () => {
    const seed = applyAttributionCookies(
      new NextRequest("https://tx.test/?utm_source=newsletter&utm_medium=email"),
      NextResponse.next(),
    );
    const next = new NextRequest("https://tx.test/cart", {
      headers: { referer: "https://tx.test/" },
    });
    next.cookies.set(COOKIE_FIRST, cookieValue(seed, COOKIE_FIRST));
    next.cookies.set(COOKIE_SESSION, cookieValue(seed, COOKIE_SESSION));

    const res = applyAttributionCookies(next, NextResponse.next());
    const session = decodeCookie<SessionTouch>(cookieValue(res, COOKIE_SESSION));
    expect(session?.session_pages).toBe(2);
    expect(session?.utm_source).toBe("newsletter");
    expect(session?.session_entry).toBe("https://tx.test/");
  });

  it("recovers from a corrupt cookie by starting a fresh session", () => {
    const req = new NextRequest("https://tx.test/");
    req.cookies.set(COOKIE_SESSION, "!!!corrupt!!!");
    const res = applyAttributionCookies(req, NextResponse.next());
    expect(decodeCookie<SessionTouch>(cookieValue(res, COOKIE_SESSION))?.session_pages).toBe(1);
  });

  it("returns the same response object it was handed", () => {
    const res = NextResponse.next();
    expect(applyAttributionCookies(new NextRequest("https://tx.test/"), res)).toBe(res);
  });
});
