export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Card-sized date, e.g. `3 Feb 2026`.
 *
 * QA: full month names ("September") overflow the single meta line on a blog
 * card at 440 and push the separator dot off the row. Cards use the short form;
 * article bodies, where there is room, keep the long form.
 */
/**
 * Fixed three-letter months rather than `month: "short"`: ICU's en-GB short
 * form is "Sept", which is four characters and reintroduces the ragged card
 * meta line this fix exists to remove.
 */
const CARD_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatCardDate(value: string | Date | undefined | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "";
  return `${d.getDate()} ${CARD_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDuration(seconds: number | undefined | null): string {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function stripHtml(html: string | undefined | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "\u2026";
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
