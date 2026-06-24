import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED = [
  /^\/dashboard/,
  /^\/business-dashboard/,
  /^\/learn/,
  /^\/profile/,
  /^\/orders/,
  /^\/certificates/,
  /^\/badges/,
  /^\/notifications/,
];
const AUTH_ROUTES = [/^\/login/, /^\/register/];

// Matches an optional locale segment at the start of a pathname, e.g. /en or /fr-BE
const localeSegmentRe = new RegExp(`^\\/(${routing.locales.join("|")})(?=/|$)`);

/** Strip locale prefix so route patterns like /^\/dashboard/ match /en/dashboard too. */
function stripLocale(pathname: string): string {
  return pathname.replace(localeSegmentRe, "") || "/";
}

function hasLocalePrefix(pathname: string): boolean {
  const first = pathname.split("/").filter(Boolean)[0];
  return Boolean(first && routing.locales.includes(first as (typeof routing.locales)[number]));
}

/**
 * Rewrite `/course/foo` → `/en/course/foo` so `[locale]` is not bound to `course`.
 * next-intl sets the locale header; this aligns App Router dynamic segments.
 */
function rewriteWithDefaultLocale(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (pathname === "/" || hasLocalePrefix(pathname)) {
    return null;
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${routing.defaultLocale}${pathname}`;
  const response = NextResponse.rewrite(url);
  response.headers.set("x-next-intl-locale", routing.defaultLocale);
  return response;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const strippedPathname = stripLocale(pathname);
  const loggedIn = req.cookies.get("user_logged_in")?.value === "1";

  // Redirect already-logged-in users away from auth pages
  if (loggedIn && AUTH_ROUTES.some((r) => r.test(strippedPathname))) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/my-learning";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Protect private routes
  if (PROTECTED.some((r) => r.test(strippedPathname))) {
    if (!loggedIn) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      const next = pathname + (req.nextUrl.search || "");
      // Internal-only redirect — never let an external URL slip through as the next param.
      url.searchParams.set("next", next.startsWith("/") ? next : "/dashboard");
      return NextResponse.redirect(url);
    }
    return intlMiddleware(req);
  }

  const localeRewrite = rewriteWithDefaultLocale(req);
  if (localeRewrite) {
    return localeRewrite;
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Match all paths except _next/static, _next/image, favicon, and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)",
  ],
};
