import type { NextRequest, NextResponse } from "next/server";
import {
  nextAttributionState,
  parseAttribution,
  type FirstTouch,
  type SessionTouch,
} from "./attribution";

export const COOKIE_FIRST = "tx_attr_first";
export const COOKIE_SESSION = "tx_attr_session";

/** 180 days — long enough to attribute a delayed purchase to its first touch. */
export const FIRST_MAX_AGE = 180 * 24 * 60 * 60;
/** 30 minutes of inactivity ends a session, matching Sourcebuster and GA4. */
export const SESSION_MAX_AGE = 30 * 60;

export interface AttributionState {
  first: FirstTouch | null;
  session: SessionTouch | null;
}

/** base64url keeps the value free of `=`, `;` and `,`, which cookies treat as syntax. */
export function encodeCookie(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function decodeCookie<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const eq = part.indexOf("=");
    if (eq < 1) continue;
    out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return out;
}

/**
 * Read the state off a raw `Cookie:` header. BFF route handlers receive a plain
 * `Request`, so this deliberately avoids `next/headers` and stays unit-testable.
 */
export function readAttributionState(cookieHeader: string | null): AttributionState {
  const jar = parseCookieHeader(cookieHeader);
  return {
    first: decodeCookie<FirstTouch>(jar[COOKIE_FIRST]),
    session: decodeCookie<SessionTouch>(jar[COOKIE_SESSION]),
  };
}

/**
 * Advance the attribution state for this request and write it onto the response
 * the proxy is already returning. Mutates and returns the same response so it
 * composes with a redirect, a rewrite, or a next-intl pass-through alike.
 */
export function applyAttributionCookies(req: NextRequest, res: NextResponse): NextResponse {
  const incoming = parseAttribution(
    req.nextUrl,
    req.headers.get("referer") ?? "",
    req.nextUrl.host,
  );
  const next = nextAttributionState(
    {
      first: decodeCookie<FirstTouch>(req.cookies.get(COOKIE_FIRST)?.value),
      session: decodeCookie<SessionTouch>(req.cookies.get(COOKIE_SESSION)?.value),
    },
    incoming,
    new Date(),
  );

  const shared = {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
  } as const;

  res.cookies.set(COOKIE_FIRST, encodeCookie(next.first), { ...shared, maxAge: FIRST_MAX_AGE });
  res.cookies.set(COOKIE_SESSION, encodeCookie(next.session), {
    ...shared,
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
