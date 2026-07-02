import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export interface AuthUserPayload {
  email: string;
  displayName: string;
  nicename: string;
}

export function normalizeAuthUser(user: Record<string, unknown> | undefined): AuthUserPayload {
  const u = user ?? {};
  const displayName =
    (typeof u.display_name === "string" && u.display_name) ||
    (typeof u.name === "string" && u.name) ||
    (typeof u.user_nicename === "string" && u.user_nicename) ||
    "";
  const email = typeof u.email === "string" ? u.email : "";
  const nicename =
    (typeof u.user_nicename === "string" && u.user_nicename) ||
    (typeof u.username === "string" && u.username) ||
    "";

  return { email, displayName, nicename };
}

export function authCookieOptions(maxAge: number): Omit<ResponseCookie, "name" | "value"> {
  return {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  };
}

export function setSessionCookies(
  cookieStore: {
    set: (name: string, value: string, options: Omit<ResponseCookie, "name" | "value">) => void;
  },
  tokens: { access_token: string; refresh_token?: string; expires_in?: number },
): number {
  const maxAge = typeof tokens.expires_in === "number" ? tokens.expires_in : 86400;
  const base = authCookieOptions(maxAge);

  cookieStore.set("access_token", tokens.access_token, { ...base, httpOnly: true });
  if (tokens.refresh_token) {
    cookieStore.set("refresh_token", tokens.refresh_token, {
      ...authCookieOptions(7 * 24 * 60 * 60),
      httpOnly: true,
    });
  }
  cookieStore.set("user_logged_in", "1", { ...base, httpOnly: false });

  return maxAge;
}

export function clearImpersonationCookies(cookieStore: { delete: (name: string) => void }): void {
  cookieStore.delete("orig_access_token");
  cookieStore.delete("orig_refresh_token");
  cookieStore.delete("impersonating");
  cookieStore.delete("impersonating_as");
}

export function clearSessionCookies(cookieStore: { delete: (name: string) => void }): void {
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_logged_in");
  clearImpersonationCookies(cookieStore);
}
