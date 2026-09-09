# Order Attribution (headless) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore per-order traffic attribution (landing page, traffic source, UTMs) for orders placed through the headless frontend, so WooCommerce stops recording every order's source as "REST API".

**Architecture:** The Next.js proxy parses UTMs and referrer on every page navigation and writes two httpOnly first-party cookies. Because BFF routes are same-origin, the browser attaches those cookies to every `/api/*` call automatically, so the order-creating routes read attribution straight off the incoming `Request` and map it onto WooCommerce's own `_wc_order_attribution_*` order meta. No client JavaScript, no PHP, no new services.

**Tech Stack:** Next.js 16.2.9 App Router, TypeScript, Vitest + jsdom, WooCommerce REST API v3, WooCommerce Store API.

**Spec:** `docs/ORDER_ATTRIBUTION.md`

## Global Constraints

- Package manager is **pnpm**. Never `npm` or `yarn`.
- Path alias `@/` maps to `src/`.
- Attribution is **best-effort**. A missing, corrupt, or unwritable attribution value must never fail an order or a payment. Every failure path swallows and continues.
- The attribution cookies are `httpOnly`, `secure` when the request is HTTPS, `sameSite=lax`, path `/`. Names are exactly `tx_attr_first` and `tx_attr_session`.
- Nothing user-controlled from a request **body** may enter order meta. Attribution is read from the cookie header only.
- WooCommerce meta key prefix is exactly `_wc_order_attribution_`.
- `session_start_time` format is MySQL UTC datetime: `YYYY-MM-DD HH:MM:SS`.
- Two write shapes, and they differ on purpose. WC REST v3 `meta_data` takes
  **17** prefixed keys including `device_type`. The Store API extension takes
  **16** unprefixed keys, excluding `device_type`, which WooCommerce derives
  from `user_agent` itself.
- Every Store API extension field must be present and must be a **string**.
  Omitted keys raise a PHP undefined-key warning; use the literal `"(none)"`,
  which WooCommerce explicitly skips.
- Every factual claim about WooCommerce internals in this plan is sourced from
  `docs/research/2026-09-09-woocommerce-order-attribution.md`, which pins each
  one to a file path and code excerpt in WooCommerce `trunk`.
- Run `pnpm typecheck` and `pnpm lint` before every commit.
- If `node_modules` is absent, run `pnpm install` before Task 1.

---

## File Structure

| File                                         | Responsibility                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/lib/analytics/attribution.ts`           | Pure parsing and session-state rules. No I/O, no framework imports.                      |
| `src/lib/analytics/attribution-cookies.ts`   | Cookie names, encoding, reading a raw `Cookie:` header, writing to a `NextResponse`.     |
| `src/lib/analytics/order-attribution.ts`     | Maps attribution state onto both WooCommerce write shapes. Pure.                         |
| `src/proxy.ts`                               | Modified: attaches the cookies to whatever response the existing routing logic produced. |
| `src/app/api/orders/route.ts`                | Modified: inlines the 17-key meta into the WC REST v3 create payload.                    |
| `src/app/api/cart/checkout/route.ts`         | Modified: injects the Store API attribution extension into the checkout body.            |
| `src/app/api/orders/[id]/store-pay/route.ts` | Modified: same extension on the order-pay body.                                          |

Tests mirror the existing flat convention in `src/__tests__/`.

---

### Task 1: Attribution parsing library

Pure functions only. This is the whole classification rulebook, so it carries the densest tests and nothing else depends on framework behaviour.

**Files:**

- Create: `src/lib/analytics/attribution.ts`
- Test: `src/__tests__/attribution.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `type SourceType = "utm" | "organic" | "referral" | "typein"`
  - `interface Attribution` with fields `source_type`, `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`, `utm_source_platform`, `utm_creative_format`, `utm_marketing_tactic`, `session_entry` (all `string` except `source_type`)
  - `interface FirstTouch extends Attribution { session_count: number }`
  - `interface SessionTouch extends Attribution { session_start_time: string; session_pages: number }`
  - `parseAttribution(url: URL, referrer: string, siteHost: string): Attribution`
  - `nextAttributionState(prev: { first: FirstTouch | null; session: SessionTouch | null }, incoming: Attribution, now: Date): { first: FirstTouch; session: SessionTouch }`
  - `deviceType(ua: string): "Desktop" | "Mobile" | "Tablet"`
  - `toMysqlUtc(d: Date): string`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/attribution.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  parseAttribution,
  nextAttributionState,
  deviceType,
  toMysqlUtc,
  type Attribution,
  type SessionTouch,
} from "@/lib/analytics/attribution";

const SITE = "tx.test";

function at(path: string, referrer = ""): Attribution {
  return parseAttribution(new URL(`https://tx.test${path}`), referrer, SITE);
}

describe("parseAttribution()", () => {
  it("classifies an explicit campaign as utm and keeps every supplied parameter", () => {
    const a = at(
      "/?utm_source=newsletter&utm_medium=email&utm_campaign=spring&utm_content=hero&utm_term=fire",
    );
    expect(a.source_type).toBe("utm");
    expect(a.utm_source).toBe("newsletter");
    expect(a.utm_medium).toBe("email");
    expect(a.utm_campaign).toBe("spring");
    expect(a.utm_content).toBe("hero");
    expect(a.utm_term).toBe("fire");
  });

  it("treats a campaign with only utm_campaign as utm, defaulting the missing source and medium", () => {
    const a = at("/?utm_campaign=spring");
    expect(a.source_type).toBe("utm");
    expect(a.utm_source).toBe("(direct)");
    expect(a.utm_medium).toBe("(none)");
    expect(a.utm_campaign).toBe("spring");
  });

  it("maps gclid to paid Google when no utm parameters are present", () => {
    const a = at("/?gclid=abc123");
    expect(a.source_type).toBe("utm");
    expect(a.utm_source).toBe("google");
    expect(a.utm_medium).toBe("cpc");
  });

  it("maps fbclid to paid Facebook", () => {
    const a = at("/?fbclid=abc123");
    expect(a.utm_source).toBe("facebook");
    expect(a.utm_medium).toBe("cpc");
  });

  it("maps msclkid to paid Bing", () => {
    const a = at("/?msclkid=abc123");
    expect(a.utm_source).toBe("bing");
    expect(a.utm_medium).toBe("cpc");
  });

  it("prefers utm parameters over a click id when both are present", () => {
    const a = at("/?utm_source=newsletter&utm_medium=email&gclid=abc123");
    expect(a.utm_source).toBe("newsletter");
    expect(a.utm_medium).toBe("email");
  });

  it("classifies a search engine referrer as organic and stores the bare engine name", () => {
    const a = at("/course/fire-warden", "https://www.google.co.uk/search?q=fire+warden");
    expect(a.source_type).toBe("organic");
    expect(a.utm_source).toBe("google");
    expect(a.utm_medium).toBe("organic");
  });

  it("recognises a search engine on a search subdomain", () => {
    const a = at("/", "https://search.brave.com/search?q=x");
    expect(a.source_type).toBe("organic");
    expect(a.utm_source).toBe("brave");
  });

  it("classifies any other external referrer as a referral keyed by hostname", () => {
    const a = at("/", "https://news.ycombinator.com/item?id=1");
    expect(a.source_type).toBe("referral");
    expect(a.utm_source).toBe("news.ycombinator.com");
    expect(a.utm_medium).toBe("referral");
  });

  it("treats a referrer from this site as direct, so internal navigation never rewrites the source", () => {
    const a = at("/checkout", "https://tx.test/cart");
    expect(a.source_type).toBe("typein");
    expect(a.utm_source).toBe("(direct)");
  });

  it("treats a missing referrer as direct", () => {
    const a = at("/");
    expect(a.source_type).toBe("typein");
    expect(a.utm_source).toBe("(direct)");
    expect(a.utm_medium).toBe("(none)");
  });

  it("ignores an unparseable referrer instead of throwing", () => {
    const a = at("/", "not a url");
    expect(a.source_type).toBe("typein");
  });

  it("records the entry page without its query string", () => {
    const a = at("/course/fire-warden?utm_source=nl");
    expect(a.session_entry).toBe("https://tx.test/course/fire-warden");
  });
});

describe("deviceType()", () => {
  it("reads an iPhone as Mobile", () => {
    expect(deviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15")).toBe(
      "Mobile",
    );
  });

  it("reads an iPad as Tablet", () => {
    expect(deviceType("Mozilla/5.0 (iPad; CPU OS 17_0) AppleWebKit/605.1.15")).toBe("Tablet");
  });

  it("reads an Android phone as Mobile", () => {
    expect(deviceType("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36")).toBe(
      "Mobile",
    );
  });

  it("reads an Android tablet, which omits the Mobile token, as Tablet", () => {
    expect(deviceType("Mozilla/5.0 (Linux; Android 14; SM-X200) Safari/537.36")).toBe("Tablet");
  });

  it("falls back to Desktop", () => {
    expect(deviceType("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36")).toBe(
      "Desktop",
    );
  });

  it("falls back to Desktop for an empty user agent", () => {
    expect(deviceType("")).toBe("Desktop");
  });
});

describe("toMysqlUtc()", () => {
  it("formats a date as a MySQL UTC datetime", () => {
    expect(toMysqlUtc(new Date("2026-09-09T15:26:07.412Z"))).toBe("2026-09-09 15:26:07");
  });
});

describe("nextAttributionState()", () => {
  const now = new Date("2026-09-09T10:00:00.000Z");

  it("opens the first session and seeds first-touch from the same visit", () => {
    const incoming = at("/?utm_source=newsletter&utm_medium=email");
    const s = nextAttributionState({ first: null, session: null }, incoming, now);
    expect(s.first.utm_source).toBe("newsletter");
    expect(s.first.session_count).toBe(1);
    expect(s.session.session_pages).toBe(1);
    expect(s.session.session_start_time).toBe("2026-09-09 10:00:00");
  });

  it("counts a page instead of restarting the session on internal navigation", () => {
    const first = { ...at("/?utm_source=newsletter&utm_medium=email"), session_count: 1 };
    const session: SessionTouch = {
      ...at("/?utm_source=newsletter&utm_medium=email"),
      session_start_time: "2026-09-09 09:50:00",
      session_pages: 3,
    };
    const s = nextAttributionState(
      { first, session },
      at("/checkout", "https://tx.test/cart"),
      now,
    );
    expect(s.session.session_pages).toBe(4);
    expect(s.session.session_start_time).toBe("2026-09-09 09:50:00");
    expect(s.session.utm_source).toBe("newsletter");
    expect(s.first.session_count).toBe(1);
  });

  it("starts a new session and bumps the lifetime count when the session cookie has expired", () => {
    const first = { ...at("/?utm_source=newsletter&utm_medium=email"), session_count: 2 };
    const s = nextAttributionState(
      { first, session: null },
      at("/", "https://www.google.com/"),
      now,
    );
    expect(s.first.session_count).toBe(3);
    expect(s.session.source_type).toBe("organic");
    expect(s.session.session_pages).toBe(1);
  });

  it("never overwrites first-touch when a later campaign arrives", () => {
    const first = { ...at("/?utm_source=newsletter&utm_medium=email"), session_count: 1 };
    const s = nextAttributionState(
      { first, session: null },
      at("/?utm_source=google&utm_medium=cpc"),
      now,
    );
    expect(s.first.utm_source).toBe("newsletter");
    expect(s.session.utm_source).toBe("google");
  });

  it("restarts the session mid-session when a different campaign arrives", () => {
    const first = { ...at("/?utm_source=newsletter&utm_medium=email"), session_count: 1 };
    const session: SessionTouch = {
      ...at("/?utm_source=newsletter&utm_medium=email"),
      session_start_time: "2026-09-09 09:50:00",
      session_pages: 3,
    };
    const s = nextAttributionState(
      { first, session },
      at("/?utm_source=google&utm_medium=cpc"),
      now,
    );
    expect(s.session.utm_source).toBe("google");
    expect(s.session.session_pages).toBe(1);
    expect(s.first.session_count).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test attribution`
Expected: FAIL, cannot resolve `@/lib/analytics/attribution`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/analytics/attribution.ts`:

```ts
/**
 * Visit attribution capture — the half of WooCommerce Order Attribution that
 * headless removes.
 *
 * Both WooCommerce's own attribution and PixelYourSite capture UTMs and the
 * referrer with a script enqueued on WordPress-rendered pages. No visitor ever
 * loads one here, and orders reach WooCommerce server-to-server with no browser
 * context, which is why every order records "REST API" as its traffic source.
 *
 * These functions are pure and framework-free. `attribution-cookies.ts` owns
 * the cookie I/O; `order-attribution.ts` owns the WooCommerce mapping.
 */

export type SourceType = "utm" | "organic" | "referral" | "typein";

export interface Attribution {
  source_type: SourceType;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  utm_id: string;
  utm_source_platform: string;
  utm_creative_format: string;
  utm_marketing_tactic: string;
  /** Origin + pathname of the page that opened the session. Never the query string. */
  session_entry: string;
}

export interface FirstTouch extends Attribution {
  session_count: number;
}

export interface SessionTouch extends Attribution {
  session_start_time: string;
  session_pages: number;
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "utm_source_platform",
  "utm_creative_format",
  "utm_marketing_tactic",
] as const;

/** Paid click identifiers, in the order they win when several are present. */
const CLICK_IDS: ReadonlyArray<readonly [param: string, source: string]> = [
  ["gclid", "google"],
  ["fbclid", "facebook"],
  ["msclkid", "bing"],
];

const SEARCH_ENGINES = new Set([
  "google",
  "bing",
  "yahoo",
  "duckduckgo",
  "yandex",
  "ecosia",
  "baidu",
  "qwant",
  "startpage",
  "brave",
]);

/**
 * Reduce a referrer host to the label a report should show: `www.google.co.uk`
 * and `search.brave.com` both collapse to their engine name.
 */
export function engineName(host: string): string {
  return host
    .toLowerCase()
    .replace(/^(www|search|m)\./, "")
    .split(".")[0];
}

export function isSearchEngine(host: string): boolean {
  return SEARCH_ENGINES.has(engineName(host));
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return "";
  }
}

function param(url: URL, key: string): string {
  return (url.searchParams.get(key) ?? "").trim();
}

export function parseAttribution(url: URL, referrer: string, siteHost: string): Attribution {
  const base: Attribution = {
    source_type: "typein",
    referrer: referrer || "",
    utm_source: "(direct)",
    utm_medium: "(none)",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    utm_id: "",
    utm_source_platform: "",
    utm_creative_format: "",
    utm_marketing_tactic: "",
    session_entry: `${url.origin}${url.pathname}`,
  };

  if (UTM_KEYS.some((k) => param(url, k) !== "")) {
    return {
      ...base,
      source_type: "utm",
      utm_source: param(url, "utm_source") || "(direct)",
      utm_medium: param(url, "utm_medium") || "(none)",
      utm_campaign: param(url, "utm_campaign"),
      utm_content: param(url, "utm_content"),
      utm_term: param(url, "utm_term"),
      utm_id: param(url, "utm_id"),
      utm_source_platform: param(url, "utm_source_platform"),
      utm_creative_format: param(url, "utm_creative_format"),
      utm_marketing_tactic: param(url, "utm_marketing_tactic"),
    };
  }

  for (const [key, source] of CLICK_IDS) {
    if (param(url, key)) {
      return { ...base, source_type: "utm", utm_source: source, utm_medium: "cpc" };
    }
  }

  const refHost = hostOf(referrer);
  if (refHost && refHost !== siteHost.toLowerCase()) {
    if (isSearchEngine(refHost)) {
      return {
        ...base,
        source_type: "organic",
        utm_source: engineName(refHost),
        utm_medium: "organic",
      };
    }
    return {
      ...base,
      source_type: "referral",
      utm_source: refHost.replace(/^www\./, ""),
      utm_medium: "referral",
    };
  }

  return base;
}

export function deviceType(ua: string): "Desktop" | "Mobile" | "Tablet" {
  const s = ua.toLowerCase();
  // Android tablets are Android without the "mobile" token — test tablets first.
  if (/ipad|tablet|playbook|silk|android(?!.*mobi)/.test(s)) return "Tablet";
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(s)) return "Mobile";
  return "Desktop";
}

export function toMysqlUtc(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * A campaign change mid-session opens a new session, matching Sourcebuster —
 * the library WooCommerce itself uses. A direct hit never does, otherwise every
 * internal navigation would erase the campaign that brought the visitor in.
 */
function startsNewSession(session: SessionTouch, incoming: Attribution): boolean {
  if (incoming.source_type === "typein") return false;
  return (
    incoming.source_type !== session.source_type ||
    incoming.utm_source !== session.utm_source ||
    incoming.utm_campaign !== session.utm_campaign
  );
}

export function nextAttributionState(
  prev: { first: FirstTouch | null; session: SessionTouch | null },
  incoming: Attribution,
  now: Date,
): { first: FirstTouch; session: SessionTouch } {
  if (prev.session && !startsNewSession(prev.session, incoming)) {
    return {
      first: prev.first ?? { ...incoming, session_count: 1 },
      session: { ...prev.session, session_pages: prev.session.session_pages + 1 },
    };
  }

  return {
    first: prev.first
      ? { ...prev.first, session_count: prev.first.session_count + 1 }
      : { ...incoming, session_count: 1 },
    session: { ...incoming, session_start_time: toMysqlUtc(now), session_pages: 1 },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test attribution`
Expected: PASS, 25 tests.

- [ ] **Step 5: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/lib/analytics/attribution.ts src/__tests__/attribution.test.ts
git commit -m "feat(analytics): add visit attribution parsing and session rules"
```

---

### Task 2: Attribution cookie encoding and I/O

**Files:**

- Create: `src/lib/analytics/attribution-cookies.ts`
- Test: `src/__tests__/attribution-cookies.test.ts`

**Interfaces:**

- Consumes: `parseAttribution`, `nextAttributionState`, `FirstTouch`, `SessionTouch` from `@/lib/analytics/attribution`.
- Produces:
  - `const COOKIE_FIRST = "tx_attr_first"`, `const COOKIE_SESSION = "tx_attr_session"`
  - `const FIRST_MAX_AGE: number`, `const SESSION_MAX_AGE: number`
  - `interface AttributionState { first: FirstTouch | null; session: SessionTouch | null }`
  - `encodeCookie(value: unknown): string`
  - `decodeCookie<T>(raw: string | undefined): T | null`
  - `readAttributionState(cookieHeader: string | null): AttributionState`
  - `applyAttributionCookies(req: NextRequest, res: NextResponse): NextResponse`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/attribution-cookies.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test attribution-cookies`
Expected: FAIL, cannot resolve `@/lib/analytics/attribution-cookies`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/analytics/attribution-cookies.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test attribution-cookies`
Expected: PASS, 14 tests.

If `NextRequest` cannot be constructed under jsdom, switch `vitest.config.ts`'s `environment` for this file only by adding `// @vitest-environment node` as the first line of the test file. Do not change the global environment.

- [ ] **Step 5: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/lib/analytics/attribution-cookies.ts src/__tests__/attribution-cookies.test.ts
git commit -m "feat(analytics): persist visit attribution in httpOnly cookies"
```

---

### Task 3: Write the cookies from the proxy

`src/proxy.ts` currently returns from four different branches. Extract the existing body so cookies attach to whichever response it produced, including redirects.

**Files:**

- Modify: `src/proxy.ts:49-81`
- Test: `src/__tests__/proxy-attribution.test.ts`

**Interfaces:**

- Consumes: `applyAttributionCookies`, `COOKIE_FIRST`, `COOKIE_SESSION` from `@/lib/analytics/attribution-cookies`.
- Produces: no new exports. `proxy(req)` keeps its signature.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/proxy-attribution.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test proxy-attribution`
Expected: FAIL, no attribution cookie on the response.

- [ ] **Step 3: Write minimal implementation**

In `src/proxy.ts`, add the import beneath the existing ones:

```ts
import { applyAttributionCookies } from "@/lib/analytics/attribution-cookies";
```

Rename the current exported function to a private `route`, then add a new `proxy` wrapper. Replace lines 49 to 81 with:

```ts
function route(req: NextRequest) {
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

/**
 * Capture visit attribution on every page navigation, whatever the routing
 * decision was. This is the only place a real browser context exists — orders
 * reach WooCommerce server-to-server, with no referrer and no query string.
 */
export function proxy(req: NextRequest) {
  return applyAttributionCookies(req, route(req));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test proxy-attribution`
Expected: PASS, 4 tests.

Then confirm nothing else regressed: `pnpm test`

- [ ] **Step 5: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/proxy.ts src/__tests__/proxy-attribution.test.ts
git commit -m "feat(analytics): capture visit attribution in the proxy"
```

---

### Task 4: Map attribution onto WooCommerce order meta

**Files:**

- Create: `src/lib/analytics/order-attribution.ts`
- Test: `src/__tests__/order-attribution.test.ts`

**Interfaces:**

- Consumes: `deviceType` from `@/lib/analytics/attribution`; `readAttributionState`, `AttributionState` from `@/lib/analytics/attribution-cookies`.
- Produces:
  - `const WC_ATTRIBUTION_PREFIX = "_wc_order_attribution_"`
  - `const WC_ATTRIBUTION_EXTENSION = "woocommerce/order-attribution"`
  - `interface OrderMetaEntry { key: string; value: string }`
  - `buildOrderAttributionMeta(state: AttributionState, userAgent: string): OrderMetaEntry[]` — 17 prefixed keys, empties dropped, for WC REST v3
  - `orderAttributionMetaFromRequest(req: Request): OrderMetaEntry[]`
  - `buildStoreApiAttributionExtension(state: AttributionState, userAgent: string): Record<string, string> | null` — 16 unprefixed keys, all present, all strings, for the Store API
  - `storeApiAttributionFromRequest(req: Request): Record<string, string> | null`

- [ ] **Step 1: Confirm nothing on the live store disables or renames the fields**

The key names themselves are verified against WooCommerce source in `docs/research/2026-09-09-woocommerce-order-attribution.md`. Three things about the live store are not, and any of them silently breaks everything downstream.

First, the feature toggle. In WP Admin open WooCommerce, Settings, Advanced, Features and confirm **Order Attribution** is enabled. If it is off, no meta is written, the Store API extension is not registered, and the Origin column does not exist. Stop and raise it before continuing.

Second, the two filters that can rename the fields or the prefix:

```bash
wp eval 'var_dump(
  apply_filters( "wc_order_attribution_tracking_field_prefix", "wc_order_attribution_" ),
  has_filter( "wc_order_attribution_tracking_fields" )
);'
```

Expected: the string `wc_order_attribution_`, and `false` for the second. Anything else means a plugin is rewriting the schema, and the `fields` object in Step 3 must match whatever it produces.

Third, spot-check a pre-migration order that shows real attribution:

```bash
wp db query "SELECT meta_key FROM wp_wc_orders_meta \
  WHERE order_id = <ORDER_ID> AND meta_key LIKE '%attribution%';"
```

If High-Performance Order Storage is off, the table is `wp_postmeta` and the column is `post_id`.

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/order-attribution.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  WC_ATTRIBUTION_PREFIX,
  buildOrderAttributionMeta,
  orderAttributionMetaFromRequest,
} from "@/lib/analytics/order-attribution";
import { COOKIE_FIRST, COOKIE_SESSION, encodeCookie } from "@/lib/analytics/attribution-cookies";
import type { FirstTouch, SessionTouch } from "@/lib/analytics/attribution";

const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

const SESSION: SessionTouch = {
  source_type: "utm",
  referrer: "https://mail.google.com/",
  utm_source: "newsletter",
  utm_medium: "email",
  utm_campaign: "spring",
  utm_content: "hero",
  utm_term: "",
  utm_id: "",
  utm_source_platform: "",
  utm_creative_format: "",
  utm_marketing_tactic: "",
  session_entry: "https://tx.test/course/fire-warden",
  session_start_time: "2026-09-09 10:00:00",
  session_pages: 4,
};

const FIRST: FirstTouch = { ...SESSION, session_count: 3 };

function asMap(entries: Array<{ key: string; value: string }>): Record<string, string> {
  return Object.fromEntries(entries.map((e) => [e.key, e.value]));
}

describe("buildOrderAttributionMeta()", () => {
  it("prefixes every key with the WooCommerce namespace", () => {
    const meta = buildOrderAttributionMeta({ first: FIRST, session: SESSION }, CHROME);
    expect(meta.length).toBeGreaterThan(0);
    for (const entry of meta) {
      expect(entry.key.startsWith(WC_ATTRIBUTION_PREFIX)).toBe(true);
    }
  });

  it("takes the campaign from the session, which is the last touch", () => {
    const m = asMap(buildOrderAttributionMeta({ first: FIRST, session: SESSION }, CHROME));
    expect(m[`${WC_ATTRIBUTION_PREFIX}source_type`]).toBe("utm");
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_source`]).toBe("newsletter");
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_medium`]).toBe("email");
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_campaign`]).toBe("spring");
    expect(m[`${WC_ATTRIBUTION_PREFIX}session_entry`]).toBe("https://tx.test/course/fire-warden");
  });

  it("takes the lifetime session count from first-touch", () => {
    const m = asMap(buildOrderAttributionMeta({ first: FIRST, session: SESSION }, CHROME));
    expect(m[`${WC_ATTRIBUTION_PREFIX}session_count`]).toBe("3");
    expect(m[`${WC_ATTRIBUTION_PREFIX}session_pages`]).toBe("4");
  });

  it("derives the user agent and device type from the request, not the cookie", () => {
    const m = asMap(buildOrderAttributionMeta({ first: FIRST, session: SESSION }, CHROME));
    expect(m[`${WC_ATTRIBUTION_PREFIX}user_agent`]).toBe(CHROME);
    expect(m[`${WC_ATTRIBUTION_PREFIX}device_type`]).toBe("Desktop");
  });

  it("omits empty values so WooCommerce is not given blank meta rows", () => {
    const m = asMap(buildOrderAttributionMeta({ first: FIRST, session: SESSION }, CHROME));
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_term`]).toBeUndefined();
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_id`]).toBeUndefined();
  });

  it("still emits the session count when only the session cookie survived", () => {
    const m = asMap(buildOrderAttributionMeta({ first: null, session: SESSION }, CHROME));
    expect(m[`${WC_ATTRIBUTION_PREFIX}session_count`]).toBe("1");
  });

  it("returns nothing when there is no session, so a cookieless order is left untouched", () => {
    expect(buildOrderAttributionMeta({ first: FIRST, session: null }, CHROME)).toEqual([]);
  });
});

describe("orderAttributionMetaFromRequest()", () => {
  it("reads the cookies and user agent straight off the incoming request", () => {
    const req = new Request("https://tx.test/api/orders", {
      method: "POST",
      headers: {
        cookie: `${COOKIE_FIRST}=${encodeCookie(FIRST)}; ${COOKIE_SESSION}=${encodeCookie(SESSION)}`,
        "user-agent": CHROME,
      },
    });
    const m = asMap(orderAttributionMetaFromRequest(req));
    expect(m[`${WC_ATTRIBUTION_PREFIX}utm_source`]).toBe("newsletter");
    expect(m[`${WC_ATTRIBUTION_PREFIX}device_type`]).toBe("Desktop");
  });

  it("returns nothing for a request with no cookies", () => {
    const req = new Request("https://tx.test/api/orders", { method: "POST" });
    expect(orderAttributionMetaFromRequest(req)).toEqual([]);
  });
});

describe("buildStoreApiAttributionExtension()", () => {
  it("emits exactly the sixteen unprefixed field names WooCommerce declares", () => {
    const ext = buildStoreApiAttributionExtension({ first: FIRST, session: SESSION }, CHROME);
    expect(Object.keys(ext ?? {}).sort()).toEqual(
      [
        "referrer",
        "session_count",
        "session_entry",
        "session_pages",
        "session_start_time",
        "source_type",
        "user_agent",
        "utm_campaign",
        "utm_content",
        "utm_creative_format",
        "utm_id",
        "utm_marketing_tactic",
        "utm_medium",
        "utm_source",
        "utm_source_platform",
        "utm_term",
      ].sort(),
    );
  });

  it("omits device_type, which WooCommerce derives from the user agent itself", () => {
    const ext = buildStoreApiAttributionExtension({ first: FIRST, session: SESSION }, CHROME);
    expect(ext).not.toHaveProperty("device_type");
  });

  it("substitutes (none) for empty values instead of omitting the key", () => {
    const ext = buildStoreApiAttributionExtension({ first: FIRST, session: SESSION }, CHROME);
    expect(ext?.utm_term).toBe("(none)");
    expect(ext?.utm_id).toBe("(none)");
  });

  it("casts every value to a string, including the two counters", () => {
    const ext = buildStoreApiAttributionExtension({ first: FIRST, session: SESSION }, CHROME);
    for (const value of Object.values(ext ?? {})) {
      expect(typeof value).toBe("string");
    }
    expect(ext?.session_pages).toBe("4");
    expect(ext?.session_count).toBe("3");
  });

  it("returns null when there is no session, so the request body is left untouched", () => {
    expect(buildStoreApiAttributionExtension({ first: FIRST, session: null }, CHROME)).toBeNull();
  });
});

describe("storeApiAttributionFromRequest()", () => {
  it("builds the extension from the request's cookies", () => {
    const req = new Request("https://tx.test/api/cart/checkout", {
      method: "POST",
      headers: {
        cookie: `${COOKIE_FIRST}=${encodeCookie(FIRST)}; ${COOKIE_SESSION}=${encodeCookie(SESSION)}`,
        "user-agent": CHROME,
      },
    });
    expect(storeApiAttributionFromRequest(req)?.utm_source).toBe("newsletter");
  });

  it("returns null for a request with no cookies", () => {
    expect(
      storeApiAttributionFromRequest(
        new Request("https://tx.test/api/cart/checkout", { method: "POST" }),
      ),
    ).toBeNull();
  });
});
```

Extend the import at the top of the same file to pull in the two new functions:

```ts
import {
  WC_ATTRIBUTION_PREFIX,
  buildOrderAttributionMeta,
  buildStoreApiAttributionExtension,
  orderAttributionMetaFromRequest,
  storeApiAttributionFromRequest,
} from "@/lib/analytics/order-attribution";
```

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/analytics/order-attribution.ts`:

```ts
import { deviceType } from "./attribution";
import { readAttributionState, type AttributionState } from "./attribution-cookies";

/**
 * WooCommerce's own Order Attribution namespace. Writing these keys means the
 * order list column and the Analytics reports light up with no PHP at all —
 * only the browser-side capture was ever missing in a headless setup.
 *
 * Key names verified against WooCommerce trunk,
 * src/Internal/Traits/OrderAttributionMeta.php. See
 * docs/research/2026-09-09-woocommerce-order-attribution.md.
 */
export const WC_ATTRIBUTION_PREFIX = "_wc_order_attribution_";

/**
 * Store API extension namespace WooCommerce registers for exactly this data,
 * in src/Internal/Orders/OrderAttributionBlocksController.php. Declared on the
 * `checkout` schema and inherited by `checkout-order`, so both Store API order
 * paths accept it.
 */
export const WC_ATTRIBUTION_EXTENSION = "woocommerce/order-attribution";

export interface OrderMetaEntry {
  key: string;
  value: string;
}

export function buildOrderAttributionMeta(
  state: AttributionState,
  userAgent: string,
): OrderMetaEntry[] {
  const session = state.session;
  if (!session) return [];

  const fields: Record<string, string | number> = {
    source_type: session.source_type,
    referrer: session.referrer,
    utm_source: session.utm_source,
    utm_medium: session.utm_medium,
    utm_campaign: session.utm_campaign,
    utm_content: session.utm_content,
    utm_term: session.utm_term,
    utm_id: session.utm_id,
    utm_source_platform: session.utm_source_platform,
    utm_creative_format: session.utm_creative_format,
    utm_marketing_tactic: session.utm_marketing_tactic,
    session_entry: session.session_entry,
    session_start_time: session.session_start_time,
    session_pages: session.session_pages,
    session_count: state.first?.session_count ?? 1,
    user_agent: userAgent,
    device_type: deviceType(userAgent),
  };

  return Object.entries(fields)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .map(([name, value]) => ({ key: `${WC_ATTRIBUTION_PREFIX}${name}`, value: String(value) }));
}

/** Convenience for BFF route handlers, which hold a plain `Request`. */
export function orderAttributionMetaFromRequest(req: Request): OrderMetaEntry[] {
  return buildOrderAttributionMeta(
    readAttributionState(req.headers.get("cookie")),
    req.headers.get("user-agent") ?? "",
  );
}

/**
 * The sixteen field names WooCommerce declares on the Store API extension —
 * `array_keys( $default_fields )` in the OrderAttributionMeta trait.
 *
 * Deliberately excludes `device_type`: it is not a schema field, and
 * WooCommerce derives it from `user_agent` inside `get_source_values()`.
 * The WC REST v3 path has no such derivation, which is why
 * `buildOrderAttributionMeta` above writes seventeen keys and this writes
 * sixteen.
 */
const STORE_API_FIELDS = [
  "source_type",
  "referrer",
  "utm_campaign",
  "utm_source",
  "utm_medium",
  "utm_content",
  "utm_id",
  "utm_term",
  "utm_source_platform",
  "utm_creative_format",
  "utm_marketing_tactic",
  "session_entry",
  "session_start_time",
  "session_pages",
  "session_count",
  "user_agent",
] as const;

/**
 * Build the `extensions["woocommerce/order-attribution"]` payload.
 *
 * Every field must be present and must be a string. WooCommerce indexes the
 * array with no null-coalesce, so an omitted key raises a PHP undefined-key
 * warning; `"(none)"` is the sentinel its own reader explicitly skips.
 */
export function buildStoreApiAttributionExtension(
  state: AttributionState,
  userAgent: string,
): Record<string, string> | null {
  const session = state.session;
  if (!session) return null;

  const source: Record<string, string | number> = {
    source_type: session.source_type,
    referrer: session.referrer,
    utm_campaign: session.utm_campaign,
    utm_source: session.utm_source,
    utm_medium: session.utm_medium,
    utm_content: session.utm_content,
    utm_id: session.utm_id,
    utm_term: session.utm_term,
    utm_source_platform: session.utm_source_platform,
    utm_creative_format: session.utm_creative_format,
    utm_marketing_tactic: session.utm_marketing_tactic,
    session_entry: session.session_entry,
    session_start_time: session.session_start_time,
    session_pages: session.session_pages,
    session_count: state.first?.session_count ?? 1,
    user_agent: userAgent,
  };

  const out: Record<string, string> = {};
  for (const field of STORE_API_FIELDS) {
    const value = source[field];
    out[field] = value === "" || value === undefined || value === null ? "(none)" : String(value);
  }
  return out;
}

export function storeApiAttributionFromRequest(req: Request): Record<string, string> | null {
  return buildStoreApiAttributionExtension(
    readAttributionState(req.headers.get("cookie")),
    req.headers.get("user-agent") ?? "",
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test order-attribution`
Expected: PASS, 16 tests.

- [ ] **Step 5: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/lib/analytics/order-attribution.ts src/__tests__/order-attribution.test.ts docs/ORDER_ATTRIBUTION.md
git commit -m "feat(analytics): map visit attribution onto WooCommerce order meta"
```

---

### Task 5: Attribute the Buy Now order path

WC REST v3 accepts `meta_data` on creation, including underscore-prefixed keys, so this path needs no second call. WooCommerce's `meta_data` is a controller-owned property with no protected-meta check, unlike WordPress core's registered `meta` field.

Write the meta here, at create time. This path later calls `POST /wc/store/v1/checkout/{id}` to settle payment, and WooCommerce's `has_attribution()` guard makes the Store API extension a no-op once any attribution key exists on the order. Sending it on both calls is harmless and the right defensive default, but the create is what actually sticks, so that is what the tests assert.

**Files:**

- Modify: `src/app/api/orders/route.ts:97-121`
- Test: `src/__tests__/order-attribution-routes.test.ts`

**Interfaces:**

- Consumes: `orderAttributionMetaFromRequest` from `@/lib/analytics/order-attribution`.
- Produces: no new exports. The route's response shape is unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/order-attribution-routes.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_FIRST, COOKIE_SESSION, encodeCookie } from "@/lib/analytics/attribution-cookies";
import { WC_ATTRIBUTION_PREFIX } from "@/lib/analytics/order-attribution";
import type { FirstTouch, SessionTouch } from "@/lib/analytics/attribution";

const createWCOrder = vi.fn();

vi.mock("@/lib/api/wc-orders", () => ({
  createWCOrder: (payload: unknown) => createWCOrder(payload),
  getAuthenticatedUserId: async () => null,
  setGuestOrderKeyCookie: async () => undefined,
  validateCouponCode: async () => null,
  validateLineItems: async () => null,
  wcBasicAuthHeader: () => "Basic test",
  updateWCOrder: async () => null,
}));

const { POST } = await import("@/app/api/orders/route");

const SESSION: SessionTouch = {
  source_type: "utm",
  referrer: "https://mail.google.com/",
  utm_source: "newsletter",
  utm_medium: "email",
  utm_campaign: "spring",
  utm_content: "",
  utm_term: "",
  utm_id: "",
  utm_source_platform: "",
  utm_creative_format: "",
  utm_marketing_tactic: "",
  session_entry: "https://tx.test/course/fire-warden",
  session_start_time: "2026-09-09 10:00:00",
  session_pages: 2,
};
const FIRST: FirstTouch = { ...SESSION, session_count: 1 };

const BODY = JSON.stringify({
  payment_method: "stripe",
  billing: { email: "jane@example.com" },
  line_items: [{ product_id: 12, quantity: 1 }],
});

function orderRequest(withCookies: boolean): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (withCookies) {
    headers.cookie = `${COOKIE_FIRST}=${encodeCookie(FIRST)}; ${COOKIE_SESSION}=${encodeCookie(SESSION)}`;
  }
  return new Request("https://tx.test/api/orders", { method: "POST", headers, body: BODY });
}

beforeEach(() => {
  createWCOrder.mockReset();
  createWCOrder.mockResolvedValue({
    ok: true,
    order: { id: 501, order_key: "wc_order_x", status: "pending", total: "29.99", currency: "GBP" },
  });
});

// The route returns 503 here because no Stripe secret is configured in the test
// environment. That happens *after* the order is created, so the payload these
// tests assert on is already complete. Deliberately not stubbing Stripe keeps
// this test focused on the attribution payload.
describe("POST /api/orders", () => {
  it("attaches WooCommerce attribution meta read from the visitor's cookies", async () => {
    await POST(orderRequest(true));
    const payload = createWCOrder.mock.calls[0][0] as {
      meta_data?: Array<{ key: string; value: string }>;
    };
    const map = Object.fromEntries((payload.meta_data ?? []).map((m) => [m.key, m.value]));
    expect(map[`${WC_ATTRIBUTION_PREFIX}utm_source`]).toBe("newsletter");
    expect(map[`${WC_ATTRIBUTION_PREFIX}utm_campaign`]).toBe("spring");
    expect(map[`${WC_ATTRIBUTION_PREFIX}source_type`]).toBe("utm");
  });

  it("creates the order unchanged when the visitor has no attribution cookies", async () => {
    await POST(orderRequest(false));
    const payload = createWCOrder.mock.calls[0][0] as { meta_data?: unknown };
    expect(payload.meta_data).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test order-attribution-routes`
Expected: FAIL, `map[...utm_source]` is `undefined`.

- [ ] **Step 3: Write minimal implementation**

In `src/app/api/orders/route.ts`, add to the imports:

```ts
import { orderAttributionMetaFromRequest } from "@/lib/analytics/order-attribution";
```

Immediately after the `if (userId) { wcPayload.customer_id = userId; }` block and before `const wcResult = await createWCOrder(wcPayload);`, insert:

```ts
// Visit attribution captured by the proxy. Best-effort: an order with no
// cookies is created exactly as before.
const attributionMeta = orderAttributionMetaFromRequest(req);
if (attributionMeta.length) {
  wcPayload.meta_data = attributionMeta;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test order-attribution-routes`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/app/api/orders/route.ts src/__tests__/order-attribution-routes.test.ts
git commit -m "feat(orders): attribute Buy Now orders to their originating visit"
```

---

### Task 6: Attribute the two Store API order paths

WooCommerce registers its own Store API extension for this data, namespace `woocommerce/order-attribution`, declared on the `checkout` schema and inherited by `checkout-order`. Both paths therefore carry attribution **in-band**, in the same request that places the order. Nothing is written after payment, so nothing can fail after the shopper has paid.

**Files:**

- Modify: `src/app/api/cart/checkout/route.ts`
- Modify: `src/app/api/orders/[id]/store-pay/route.ts:24-25`
- Test: `src/__tests__/order-attribution-store-routes.test.ts`

**Interfaces:**

- Consumes: `storeApiAttributionFromRequest`, `WC_ATTRIBUTION_EXTENSION` from `@/lib/analytics/order-attribution`; `proxyToWCStore` from `@/lib/api/bff`.
- Produces: no new exports. Both routes keep their signatures and response shapes.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/order-attribution-store-routes.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { COOKIE_FIRST, COOKIE_SESSION, encodeCookie } from "@/lib/analytics/attribution-cookies";
import { WC_ATTRIBUTION_EXTENSION } from "@/lib/analytics/order-attribution";
import type { FirstTouch, SessionTouch } from "@/lib/analytics/attribution";

const proxyToWCStore = vi.fn();

vi.mock("@/lib/api/bff", () => ({
  proxyToWCStore: (path: string, options: unknown) => proxyToWCStore(path, options),
}));

const { POST: checkoutPOST } = await import("@/app/api/cart/checkout/route");
const { POST: storePayPOST } = await import("@/app/api/orders/[id]/store-pay/route");

const SESSION: SessionTouch = {
  source_type: "organic",
  referrer: "https://www.google.com/",
  utm_source: "google",
  utm_medium: "organic",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  utm_id: "",
  utm_source_platform: "",
  utm_creative_format: "",
  utm_marketing_tactic: "",
  session_entry: "https://tx.test/",
  session_start_time: "2026-09-09 10:00:00",
  session_pages: 5,
};
const FIRST: FirstTouch = { ...SESSION, session_count: 2 };

/** The body the proxy was actually called with, for the most recent call. */
function sentBody(): Record<string, unknown> {
  const options = proxyToWCStore.mock.calls.at(-1)?.[1] as { body: Record<string, unknown> };
  return options.body;
}

function withCookies(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `${COOKIE_FIRST}=${encodeCookie(FIRST)}; ${COOKIE_SESSION}=${encodeCookie(SESSION)}`,
      "user-agent": "Mozilla/5.0 (Macintosh) Safari/537.36",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  proxyToWCStore.mockReset();
  proxyToWCStore.mockResolvedValue(NextResponse.json({ order_id: 777, status: "processing" }));
});

describe("POST /api/cart/checkout", () => {
  it("adds the WooCommerce attribution extension to the checkout body", async () => {
    await checkoutPOST(
      withCookies("https://tx.test/api/cart/checkout", { payment_method: "stripe" }),
    );

    const extensions = sentBody().extensions as Record<string, Record<string, string>>;
    const attribution = extensions[WC_ATTRIBUTION_EXTENSION];
    expect(attribution.source_type).toBe("organic");
    expect(attribution.utm_source).toBe("google");
    expect(attribution.session_count).toBe("2");
  });

  it("sends all sixteen fields, because WooCommerce warns on an omitted key", async () => {
    await checkoutPOST(withCookies("https://tx.test/api/cart/checkout", {}));

    const extensions = sentBody().extensions as Record<string, Record<string, string>>;
    expect(Object.keys(extensions[WC_ATTRIBUTION_EXTENSION])).toHaveLength(16);
    expect(extensions[WC_ATTRIBUTION_EXTENSION].utm_campaign).toBe("(none)");
  });

  it("preserves the caller's own body fields and any extensions already present", async () => {
    await checkoutPOST(
      withCookies("https://tx.test/api/cart/checkout", {
        payment_method: "stripe",
        extensions: { "acme/gift-note": { message: "hi" } },
      }),
    );

    const body = sentBody();
    expect(body.payment_method).toBe("stripe");
    const extensions = body.extensions as Record<string, unknown>;
    expect(extensions["acme/gift-note"]).toEqual({ message: "hi" });
    expect(extensions[WC_ATTRIBUTION_EXTENSION]).toBeDefined();
  });

  it("leaves the body untouched when the visitor has no attribution cookies", async () => {
    await checkoutPOST(
      new Request("https://tx.test/api/cart/checkout", {
        method: "POST",
        body: JSON.stringify({ payment_method: "stripe" }),
      }),
    );

    expect(sentBody().extensions).toBeUndefined();
  });

  it("returns the upstream response unchanged", async () => {
    const res = await checkoutPOST(withCookies("https://tx.test/api/cart/checkout", {}));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ order_id: 777 });
  });
});

describe("POST /api/orders/[id]/store-pay", () => {
  it("adds the same extension to the order-pay body", async () => {
    await storePayPOST(withCookies("https://tx.test/api/orders/900/store-pay", { key: "wc_x" }), {
      params: Promise.resolve({ id: "900" }),
    });

    const extensions = sentBody().extensions as Record<string, Record<string, string>>;
    expect(extensions[WC_ATTRIBUTION_EXTENSION].utm_source).toBe("google");
    expect(proxyToWCStore.mock.calls[0][0]).toBe("/checkout/900");
  });

  it("rejects an invalid order id before reaching WooCommerce", async () => {
    const res = await storePayPOST(withCookies("https://tx.test/api/orders/abc/store-pay", {}), {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
    expect(proxyToWCStore).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test order-attribution-store-routes`
Expected: FAIL, `sentBody().extensions` is `undefined`.

- [ ] **Step 3: Write minimal implementation**

Both routes need the same three lines, so add a small helper to `src/lib/analytics/order-attribution.ts`:

```ts
/**
 * Merge the WooCommerce attribution extension into a Store API request body,
 * leaving any extension the caller already set in place. Returns the body
 * unchanged when the visitor carries no attribution cookies.
 */
export function withStoreApiAttribution(
  body: Record<string, unknown>,
  req: Request,
): Record<string, unknown> {
  const attribution = storeApiAttributionFromRequest(req);
  if (!attribution) return body;

  const existing = (body.extensions ?? {}) as Record<string, unknown>;
  return {
    ...body,
    extensions: { ...existing, [WC_ATTRIBUTION_EXTENSION]: attribution },
  };
}
```

Replace `src/app/api/cart/checkout/route.ts` entirely with:

```ts
import { proxyToWCStore } from "@/lib/api/bff";
import { withStoreApiAttribution } from "@/lib/analytics/order-attribution";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return proxyToWCStore("/checkout", {
    method: "POST",
    body: withStoreApiAttribution(body, req),
    request: req,
  });
}
```

In `src/app/api/orders/[id]/store-pay/route.ts`, add the import:

```ts
import { withStoreApiAttribution } from "@/lib/analytics/order-attribution";
```

and replace the final two lines (`const body = …` and `return proxyToWCStore(…)`) with:

```ts
const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
return proxyToWCStore(`/checkout/${orderId}`, {
  method: "POST",
  body: withStoreApiAttribution(body, req),
  request: req,
});
```

Add `withStoreApiAttribution` to the Task 4 test file's import list if you want it covered there too; the route tests above already exercise it.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test order-attribution-store-routes`
Expected: PASS, 7 tests.

Then run the whole suite: `pnpm test`

- [ ] **Step 5: Commit**

```bash
pnpm typecheck && pnpm lint
git add src/lib/analytics/order-attribution.ts src/app/api/cart/checkout/route.ts "src/app/api/orders/[id]/store-pay/route.ts" src/__tests__/order-attribution-store-routes.test.ts
git commit -m "feat(orders): send order attribution through the Store API checkout extension"
```

---

### Task 7: Document the layer and verify end to end against the real store

**Files:**

- Modify: `CLAUDE.md` (Architecture section, after "Site settings and feature flags")
- Modify: `AGENTS.md` (same section, same text — the two files carry parallel content)
- Modify: `docs/ORDER_ATTRIBUTION.md` (record the verification result)

**Interfaces:**

- Consumes: everything built in Tasks 1 through 6.
- Produces: no code.

- [ ] **Step 1: Add the architecture note**

Insert this section into both `CLAUDE.md` and `AGENTS.md`, directly after the "Site settings and feature flags" subsection:

```markdown
### Order attribution

WooCommerce and PixelYourSite both capture traffic source with a script
enqueued on WordPress-rendered pages. Headless, no visitor ever loads one and
orders arrive server-to-server, so every order used to record its source as
`REST API`.

`src/proxy.ts` now parses UTMs, click identifiers and the referrer on every
page navigation and writes two httpOnly cookies, `tx_attr_first` (180 days)
and `tx_attr_session` (30 minutes). BFF routes are same-origin, so those
cookies ride along with every `/api/*` call and the order routes read them off
the incoming `Request` — nothing user-controlled from a request body ever
reaches order meta.

`buildOrderAttributionMeta()` maps the state onto WooCommerce's own
`_wc_order_attribution_*` keys, which drives the order list column and the
Analytics reports with no PHP. WC REST v3 takes 17 prefixed keys as
`meta_data` on creation. The two Store API paths take 16 unprefixed ones
through WooCommerce's own `woocommerce/order-attribution` extension namespace,
in-band on the same request. Attribution is always best-effort and never fails
an order. Full spec in `docs/ORDER_ATTRIBUTION.md`, with the WooCommerce
internals sourced in `docs/research/2026-09-09-woocommerce-order-attribution.md`.
```

- [ ] **Step 2: Verify a campaign visit end to end**

Start the dev server with `pnpm dev`, then:

1. Open `http://localhost:3000/?utm_source=verify&utm_medium=email&utm_campaign=plantest` in a fresh private window.
2. In DevTools, Application, Cookies, confirm `tx_attr_first` and `tx_attr_session` exist and are marked HttpOnly.
3. Add a course to the cart and complete checkout with a Stripe test card.
4. In WP Admin open the orders list. The Origin column must read exactly `Source: Verify`, not `Unknown`. WooCommerce builds that label from `utm_source` alone and applies `ucfirst`, so the campaign name does not appear there. It appears on the order edit screen and in Analytics.
5. Confirm the stored meta:

```bash
wp db query "SELECT meta_key, meta_value FROM wp_wc_orders_meta \
  WHERE order_id = <NEW_ORDER_ID> AND meta_key LIKE '_wc_order_attribution%';"
```

Expected: `utm_source` is `verify`, `utm_campaign` is `plantest`, `source_type` is `utm`, and `session_entry` is the landing page rather than the checkout page.

- [ ] **Step 3: Verify the organic and direct cases**

Repeat step 2 twice more in fresh private windows:

- Reach the site from a real Google result. Expect `source_type` `organic`, `utm_source` `google`, and an Origin column reading exactly `Organic: Google`.
- Type the URL in directly. Expect `source_type` `typein`, `utm_source` `(direct)`, and an Origin column reading exactly `Direct`. WooCommerce discards `utm_source` for this source type, so the stored `(direct)` never surfaces.

- [ ] **Step 4: Verify the Buy Now path separately**

Use the Buy Now button on a course page rather than the cart. That path goes through `POST /api/orders` instead of the Store API, so it must be checked on its own. Confirm the same meta lands.

The third path, `POST /api/orders/[id]/store-pay`, only runs for B2B licences and retry-pay of a pending order. It is covered by the unit tests in Task 6. Verify it manually only if a B2B licence order is convenient to place.

- [ ] **Step 5: Record the outcome and commit**

Append a "Verified" section to `docs/ORDER_ATTRIBUTION.md` naming the order IDs used and any meta key that differed from the plan's list.

```bash
git add CLAUDE.md AGENTS.md docs/ORDER_ATTRIBUTION.md
git commit -m "docs: describe the headless order attribution layer"
```

---

### Task 8 (optional): Populate the PixelYourSite metabox

Skip this task freely. It restores the metabox in your screenshots but adds query-string noise to the order-creating calls, and nothing downstream depends on it. Do it only if someone still reads that box.

PixelYourSite stores all of its attribution in one order meta key, `pys_enrich_data`, and reads every field through a helper that prefers `$_REQUEST` over its cookie and session fallback. So query-string parameters on the order-creating request populate it with no PHP and no plugin change. The literal `REST API` you see today is a deliberate sentinel the plugin substitutes when the cookie and session are empty and `REST_REQUEST` is defined.

Query string, not JSON body. PHP builds `$_REQUEST` from `$_GET` and `$_POST`, and a JSON body never reaches `$_POST`. WordPress ignores REST parameters it has no schema for, so WooCommerce is unaffected.

**Understand what you are relying on.** PixelYourSite's published filter and hook reference documents no hook for supplying or overriding this data. The `$_REQUEST` precedence is an implementation detail of the current version, not a supported interface, so a plugin update can silently break it. Nothing else depends on this task, and the WooCommerce attribution from Tasks 1 to 7 is unaffected if it stops working. That asymmetry is the reason this task is optional and last.

Worth knowing before you spend time here: the vendor's own documented pattern for REST-created orders is to **suppress** PixelYourSite server-side events for them, using `pys_disable_server_event_filter` with a `get_created_via() === 'rest-api'` check. That is the plugin author telling you headless orders are outside what it handles.

**Files:**

- Create: `src/lib/analytics/pixelyoursite.ts`
- Modify: `src/lib/api/wc-orders.ts` (`createWCOrder` gains an optional query string)
- Modify: `src/app/api/orders/route.ts`
- Modify: `src/app/api/cart/checkout/route.ts`
- Test: `src/__tests__/pixelyoursite-params.test.ts`

**Interfaces:**

- Consumes: `readAttributionState`, `AttributionState` from `@/lib/analytics/attribution-cookies`.
- Produces: `pixelYourSiteQuery(state: AttributionState): string` returning a `?`-prefixed query string, or `""` when there is nothing to send.

- [ ] **Step 1: Confirm the parameter-to-box mapping on the live store**

Two things are reasoned from the plugin source but not executed. Settle them before writing code, because guessing wrong here writes wrong data into a customer record.

First, confirm PixelYourSite is set to store data on orders at all. In WP Admin open PixelYourSite, WooCommerce, and check the option that saves data to orders is enabled. If it is off, stop; there is nothing to populate.

Second, place one throwaway order against staging with the parameters appended by hand, then read the metabox:

```bash
curl -u "$WC_KEY:$WC_SECRET" -X POST \
  "https://cms.trainingexcellence.org.uk/wp-json/wc/v3/orders?pys_landing=https%3A%2F%2Ftx.test%2Fcourses&pys_source=google&pys_utm=utm_source%3Agoogle%7Cutm_medium%3Aorganic%7Cutm_campaign%3Aundefined%7Cutm_term%3Aundefined%7Cutm_content%3Aundefined&last_pys_landing=https%3A%2F%2Ftx.test%2Fcourses&last_pys_source=google&last_pys_utm=utm_source%3Agoogle%7Cutm_medium%3Aorganic%7Cutm_campaign%3Aundefined%7Cutm_term%3Aundefined%7Cutm_content%3Aundefined" \
  -H "Content-Type: application/json" \
  -d '{"status":"pending","billing":{"email":"attr-test@example.com"}}'
```

Open the resulting order and read the PixelYourSite box. Record which block, FIRST VISIT or LAST VISIT, each prefix landed in, and whether `pys_utm_id` is needed. Write the answer into `docs/ORDER_ATTRIBUTION.md`. If the box still reads `REST API`, the approach does not work on this install; delete this task and move on.

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/pixelyoursite-params.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pixelYourSiteQuery } from "@/lib/analytics/pixelyoursite";
import type { FirstTouch, SessionTouch } from "@/lib/analytics/attribution";

const SESSION: SessionTouch = {
  source_type: "organic",
  referrer: "https://www.google.com/",
  utm_source: "google",
  utm_medium: "organic",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  utm_id: "",
  utm_source_platform: "",
  utm_creative_format: "",
  utm_marketing_tactic: "",
  session_entry: "https://tx.test/courses",
  session_start_time: "2026-09-09 10:00:00",
  session_pages: 3,
};

const FIRST: FirstTouch = {
  ...SESSION,
  source_type: "utm",
  utm_source: "newsletter",
  utm_medium: "email",
  utm_campaign: "spring",
  session_entry: "https://tx.test/",
  session_count: 2,
};

function params(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe("pixelYourSiteQuery()", () => {
  it("sends first touch under the bare prefix and last touch under last_", () => {
    const q = params(pixelYourSiteQuery({ first: FIRST, session: SESSION }));
    expect(q.get("pys_landing")).toBe("https://tx.test/");
    expect(q.get("pys_source")).toBe("newsletter");
    expect(q.get("last_pys_landing")).toBe("https://tx.test/courses");
    expect(q.get("last_pys_source")).toBe("google");
  });

  it("builds the pipe-delimited utm string in the plugin's field order", () => {
    const q = params(pixelYourSiteQuery({ first: FIRST, session: SESSION }));
    expect(q.get("pys_utm")).toBe(
      "utm_source:newsletter|utm_medium:email|utm_campaign:spring|utm_term:undefined|utm_content:undefined",
    );
  });

  it("uses the literal undefined for every value it does not have", () => {
    const q = params(pixelYourSiteQuery({ first: FIRST, session: SESSION }));
    expect(q.get("last_pys_utm")).toBe(
      "utm_source:google|utm_medium:organic|utm_campaign:undefined|utm_term:undefined|utm_content:undefined",
    );
  });

  it("starts with a question mark so it appends to a path directly", () => {
    expect(pixelYourSiteQuery({ first: FIRST, session: SESSION }).startsWith("?")).toBe(true);
  });

  it("falls back to the session for first touch when only the session cookie survived", () => {
    const q = params(pixelYourSiteQuery({ first: null, session: SESSION }));
    expect(q.get("pys_source")).toBe("google");
  });

  it("returns an empty string when there is no session, so no query is appended", () => {
    expect(pixelYourSiteQuery({ first: FIRST, session: null })).toBe("");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test pixelyoursite-params`
Expected: FAIL, cannot resolve `@/lib/analytics/pixelyoursite`.

- [ ] **Step 4: Write minimal implementation**

Create `src/lib/analytics/pixelyoursite.ts`:

```ts
import type { Attribution } from "./attribution";
import type { AttributionState } from "./attribution-cookies";

/**
 * PixelYourSite reads every attribution field from `$_REQUEST` before falling
 * back to its own cookie and session, so query-string parameters on the
 * order-creating call populate its order metabox with no PHP.
 *
 * The literal "REST API" it shows today is a sentinel it substitutes when the
 * cookie and session are empty and `REST_REQUEST` is defined. See
 * docs/research/2026-09-09-woocommerce-order-attribution.md.
 */
const PYS_UNKNOWN = "undefined";

/**
 * Confirmed against order 129783 on the local store, `pys_utm_id` is not a
 * plain identifier — it is its own pipe-delimited string holding the four
 * ad-platform click ids. We do not carry those, so every slot is `undefined`.
 */
function pysUtmId(): string {
  return ["fbadid", "gadid", "padid", "bingid"].map((k) => `${k}:${PYS_UNKNOWN}`).join("|");
}

function pysUtm(a: Attribution): string {
  const pairs: Array<[string, string]> = [
    ["utm_source", a.utm_source],
    ["utm_medium", a.utm_medium],
    ["utm_campaign", a.utm_campaign],
    ["utm_term", a.utm_term],
    ["utm_content", a.utm_content],
  ];
  return pairs.map(([key, value]) => `${key}:${value || PYS_UNKNOWN}`).join("|");
}

export function pixelYourSiteQuery(state: AttributionState): string {
  const last = state.session;
  if (!last) return "";
  const first: Attribution = state.first ?? last;

  const query = new URLSearchParams({
    pys_landing: first.session_entry,
    pys_source: first.utm_source,
    pys_utm: pysUtm(first),
    pys_utm_id: pysUtmId(),
    last_pys_landing: last.session_entry,
    last_pys_source: last.utm_source,
    last_pys_utm: pysUtm(last),
    last_pys_utm_id: pysUtmId(),
  });

  return `?${query.toString()}`;
}
```

In `src/lib/api/wc-orders.ts`, let `createWCOrder` take an optional query string. Change its signature and the single `fetch` URL:

```ts
export async function createWCOrder(
  payload: unknown,
  query = "",
): Promise<CreateWCOrderResult> {
  const res = await fetch(wcRestUrl(`/orders${query}`), {
```

In `src/app/api/orders/route.ts`, pass it at the call site:

```ts
import { pixelYourSiteQuery } from "@/lib/analytics/pixelyoursite";
import { readAttributionState } from "@/lib/analytics/attribution-cookies";
// …
const wcResult = await createWCOrder(
  wcPayload,
  pixelYourSiteQuery(readAttributionState(req.headers.get("cookie"))),
);
```

In `src/app/api/cart/checkout/route.ts`, append it to the Store API path:

```ts
const pys = pixelYourSiteQuery(readAttributionState(req.headers.get("cookie")));
return proxyToWCStore(`/checkout${pys}`, {
  method: "POST",
  body: withStoreApiAttribution(body, req),
  request: req,
});
```

`wcStoreUrl` and `wcRestUrl` both concatenate the path onto a base, so a path carrying a query string works without changing either helper.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test pixelyoursite-params`
Expected: PASS, 6 tests.

Then run the whole suite: `pnpm test`

- [ ] **Step 6: Verify against a real order and commit**

Place one order through the frontend and confirm the PixelYourSite box now shows a real landing page and traffic source instead of `REST API`. If FIRST VISIT and LAST VISIT are swapped relative to Step 1's finding, swap the prefixes in `pixelYourSiteQuery` rather than leaving it wrong.

```bash
pnpm typecheck && pnpm lint
git add src/lib/analytics/pixelyoursite.ts src/lib/api/wc-orders.ts src/app/api/orders/route.ts src/app/api/cart/checkout/route.ts src/__tests__/pixelyoursite-params.test.ts
git commit -m "feat(analytics): populate the PixelYourSite order metabox from captured attribution"
```

---

## Out of scope

Server-side conversion events — Meta Conversions API and GA4 Measurement
Protocol dispatched from the payment-success route, deduplicated against
browser pixels by a shared `event_id`, using Meta's free
`capi-param-builder-nodejs` for `_fbp` and `_fbc`. That work reuses the cookie
layer built here but has its own credentials, hashing rules and consent
questions. It ships as a separate plan.
