/**
 * Course category names are editorial content: most of the catalogue is named
 * with a trailing "Courses" (`Care Certificate Courses`), a few are not
 * (`Groupon`). Composing a call to action as `View all ${name} courses`
 * therefore says the word twice for most categories — `QA-COURSES-A4`, report
 * item `R-COURSES-1920-03`.
 *
 * The frame (3306:50171) reads "View all care certificate courses". Casing is
 * deliberately preserved rather than lower-cased: the names carry acronyms
 * (`HACCP`) and belong to the CMS, the same boundary that closed
 * `QA-COURSES-A3`.
 */

/** A trailing "Course"/"Courses", with any whitespace after it. */
const TRAILING_COURSE_SUFFIX = /\s+courses?\s*$/i;

/** The name is nothing but the word itself. */
const BARE_COURSE_WORD = /^\s*courses?\s*$/i;

/**
 * The category name as it should read inside a call to action — the trailing
 * "Course"/"Courses" removed, casing untouched.
 *
 * A name that is only the word, or carries the word mid-string, is returned
 * unchanged: the duplicate this fixes is the one the suffix creates.
 */
export function categoryCtaLabel(name: string): string {
  if (BARE_COURSE_WORD.test(name)) return name.trim();
  const stripped = name.replace(TRAILING_COURSE_SUFFIX, "");
  return stripped.trim() === "" ? name.trim() : stripped;
}

/** The full "view all" call-to-action string for a category. */
export function categoryCtaText(name: string): string {
  const label = categoryCtaLabel(name);
  // Already says it — appending would put it back to two.
  if (BARE_COURSE_WORD.test(label)) return `View all ${label}`;
  return `View all ${label} courses`;
}

/**
 * The category's display title in headings, the document title and structured
 * data — `QA-CAT-A6`. Same rule as {@link categoryCtaText}: the CMS name already
 * carries the word for most categories, so appending it doubles it.
 */
export function categoryCoursesTitle(name: string): string {
  const label = categoryCtaLabel(name);
  if (BARE_COURSE_WORD.test(label)) return label;
  return `${label} Courses`;
}
