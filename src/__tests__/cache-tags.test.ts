import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isKnownTag, STATIC_TAGS, TAGS, MAX_TAGS_PER_REQUEST } from "@/lib/api/cache-tags";

/**
 * The registry only earns its keep if it stays the whole vocabulary. A tag
 * introduced at a fetch site and never registered is unpurgeable, and nothing
 * about that failure is visible until someone waits out a TTL wondering why a
 * saved edit has not appeared.
 */
const TAGGED_SOURCES = [
  "src/lib/api/server.ts",
  "src/lib/services/blog.server.ts",
  "src/lib/services/cancellations.server.ts",
  "src/lib/services/contact.server.ts",
  "src/lib/services/certificate.ts",
];

describe("cache tag registry", () => {
  it("recognises every static tag it exports", () => {
    for (const tag of STATIC_TAGS) expect(isKnownTag(tag)).toBe(true);
  });

  it("leaves no literal tag string behind in the tagged source files", () => {
    const offenders: string[] = [];

    for (const file of TAGGED_SOURCES) {
      const source = readFileSync(file, "utf8");
      // Every `tags: [...]` entry should be a TAGS member or a template
      // literal; a plain quoted string is a tag that skipped the registry.
      for (const match of source.matchAll(/tags: \[([^\]]*)\]/g)) {
        for (const entry of match[1].split(",")) {
          const trimmed = entry.trim();
          if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
            offenders.push(`${file}: ${trimmed}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("accepts per-entity tags in every dynamic family", () => {
    const accepted = [
      "course:first-aid-level-2",
      "course:first-aid-level-2:curriculum",
      "course:first-aid-level-2:sections",
      "course:first-aid-level-2:related",
      "course:1483:reviews",
      "blog:why-food-hygiene-matters",
      "blog:category:health-and-safety",
      "page:about-us",
      "bundle:care-essentials",
      "product:hardcopy-certificate",
      "form:12",
      "certificate-page-hardcopy",
    ];

    for (const tag of accepted) expect(isKnownTag(tag)).toBe(true);
  });

  it("accepts a unicode and a percent-encoded slug", () => {
    // `sanitize_title()` keeps unicode, and a slug can arrive encoded. Rejecting
    // either would make those entities permanently unpurgeable.
    expect(isKnownTag("blog:café-hygiène")).toBe(true);
    expect(isKnownTag("page:caf%C3%A9")).toBe(true);
  });

  it("rejects near misses rather than purging nothing under a 200", () => {
    const rejected = [
      "setting", // the typo that started this
      "settings ",
      " settings",
      "SETTINGS",
      "course:", // family prefix with no entity
      "course:a/b", // path separator smuggled into a slug
      "course:a:b", // one family's pattern reaching into another
      "blog:my-post:evil",
      "certificate-page-", // suffix marker with no product
      "form:", // id-less
      "",
      "*",
    ];

    for (const tag of rejected) expect(isKnownTag(tag)).toBe(false);
  });

  it("keeps the settings tag exactly as WordPress will send it", () => {
    // The one tag the WP hook is guaranteed to use; renaming it silently breaks
    // the whole reason this route exists.
    expect(TAGS.settings).toBe("settings");
  });

  it("caps a purge request well above what a real hook sends", () => {
    expect(MAX_TAGS_PER_REQUEST).toBeGreaterThanOrEqual(2);
    expect(MAX_TAGS_PER_REQUEST).toBeLessThanOrEqual(50);
  });
});
