/**
 * The cache-tag vocabulary — every tag `serverFetch()` attaches to a WordPress
 * read, in one place.
 *
 * Tags exist so WordPress can purge what it just changed (see
 * `src/app/api/revalidate/route.ts`). That only works if both sides agree on
 * the strings, and `revalidateTag()` gives no signal when they don't: purging a
 * tag nothing was cached under succeeds silently. A typo on the WP side is
 * therefore indistinguishable from a working purge until someone notices a
 * stale page an hour later — which is exactly how the floating-bar notice went
 * missing on production.
 *
 * So the route validates against this registry rather than passing strings
 * through. Static tags are imported from here at every fetch site; the
 * per-entity tags are template literals at their fetch sites whose shapes the
 * `DYNAMIC_TAG_PATTERNS` below define — `src/__tests__/cache-tags.test.ts`
 * walks the tagged source files to keep both sides in agreement, so a tag
 * can't change shape at a fetch site without the purge side following.
 */

/**
 * Tags that name one fixed resource. Purgeable by exact match.
 *
 * `serverApi` in `server.ts` reads its tags from here, so this object is the
 * definition of the vocabulary rather than a list that shadows it. A tag typed
 * as a literal at a fetch site is a visible anomaly among constants.
 */
export const TAGS = {
  settings: "settings",
  footer: "footer",
  home: "home",
  homeTestimonials: "home:testimonials",
  pricing: "pricing",
  about: "about",
  coursesList: "courses:list",
  coursesFeatured: "courses:featured",
  coursesPopular: "courses:popular",
  coursesFree: "courses:free",
  bundlesList: "bundles:list",
  bundlesFeatured: "bundles:featured",
  pagesList: "pages:list",
  productsList: "products:list",
  taxonomyCategories: "taxonomy:categories",
  taxonomyLevels: "taxonomy:levels",
  taxonomyTags: "taxonomy:tags",
  reviewsList: "reviews:list",
  blogPosts: "blog:posts",
  blogCategories: "blog:categories",
  cancellationsPage: "cancellations-page",
  contactPage: "contact-page",
  certificatePage: "certificate-page",
  partners: "partners",
  testimonials: "testimonials",
  rankmathHead: "rankmath:head",
} as const;

export type StaticTag = (typeof TAGS)[keyof typeof TAGS];

/** Every static tag, for validation and for tests that walk the vocabulary. */
export const STATIC_TAGS: readonly StaticTag[] = Object.values(TAGS);

const STATIC_TAG_SET: ReadonlySet<string> = new Set(STATIC_TAGS);

/**
 * One path segment of a per-entity tag: a WordPress slug or a numeric ID.
 *
 * Unicode letters and numbers are in because `sanitize_title()` keeps them, and
 * `%` because a slug can arrive percent-encoded — including as its first
 * character (`%C3%A9quipe`), so `%` must be legal there too. Only `-` is barred
 * from leading, since `sanitize_title()` trims edge hyphens. `:` and `/` are
 * out everywhere, which is the part that matters — without that exclusion
 * `course:<slug>` would match `course:anything:at:all` and the families below
 * would stop being distinct.
 */
const SEGMENT = String.raw`[\p{L}\p{N}_%][\p{L}\p{N}_%-]*`;

/**
 * Tag families whose last segment names a single entity. Purgeable by pattern
 * match, since the set of valid values is whatever is in WordPress.
 *
 * Anchored on purpose: an unanchored pattern would accept any tag that merely
 * contains a valid one.
 */
export const DYNAMIC_TAG_PATTERNS: readonly RegExp[] = [
  // `course:<slug>` plus its sub-resources. `course:<id>:reviews` uses a course
  // ID rather than a slug; SEGMENT covers both.
  new RegExp(`^course:${SEGMENT}(?::(?:curriculum|sections|related|reviews))?$`, "u"),
  // `blog:<slug>` for one post, `blog:category:<slug>` for an archive. The
  // static `blog:posts` and `blog:categories` are matched before these run.
  new RegExp(`^blog:(?:category:)?${SEGMENT}$`, "u"),
  new RegExp(`^page:${SEGMENT}$`, "u"),
  new RegExp(`^bundle:${SEGMENT}$`, "u"),
  new RegExp(`^product:${SEGMENT}$`, "u"),
  new RegExp(`^form:${SEGMENT}$`, "u"),
  // The default certificate offer tags as bare `certificate-page` (static
  // above); every other offer suffixes its product slug.
  new RegExp(`^certificate-page-${SEGMENT}$`, "u"),
];

/**
 * Next.js's hard ceiling on a cache tag. `fetch()` silently drops any tag
 * longer than this at cache time and `revalidateTag()` refuses it, so nothing
 * can ever be cached under an oversized tag — which makes one "unknown" by
 * definition, however well its prefix matches a family below.
 */
export const MAX_TAG_LENGTH = 256;

/**
 * Whether this frontend has anything cached under `tag` — i.e. whether purging
 * it could do something.
 *
 * `blog:posts` is a static tag and `blog:<slug>` a dynamic one, so the static
 * check runs first; nothing else overlaps. The length gate runs before the
 * patterns because `SEGMENT` is unbounded: without it a megabyte slug would
 * validate and reach `revalidateTag`.
 */
export function isKnownTag(tag: string): boolean {
  if (tag.length > MAX_TAG_LENGTH) return false;
  if (STATIC_TAG_SET.has(tag)) return true;
  return DYNAMIC_TAG_PATTERNS.some((pattern) => pattern.test(tag));
}

/**
 * Ceiling on tags per purge request.
 *
 * A purge costs the WP origin a refetch of everything behind the tag, so an
 * unbounded list is an amplifier for anyone holding the secret. Well above what
 * a real option-save hook sends (one or two).
 */
export const MAX_TAGS_PER_REQUEST = 20;
