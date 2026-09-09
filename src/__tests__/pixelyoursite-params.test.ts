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

  it("sends the click-id field in the plugin's own four-slot shape", () => {
    const q = params(pixelYourSiteQuery({ first: FIRST, session: SESSION }));
    expect(q.get("pys_utm_id")).toBe(
      "fbadid:undefined|gadid:undefined|padid:undefined|bingid:undefined",
    );
    expect(q.get("last_pys_utm_id")).toBe(q.get("pys_utm_id"));
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
