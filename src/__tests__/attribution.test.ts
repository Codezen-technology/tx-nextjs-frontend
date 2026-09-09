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
