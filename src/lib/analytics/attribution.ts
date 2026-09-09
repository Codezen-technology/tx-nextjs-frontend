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
