/**
 * Date formatting for the business dashboard.
 *
 * Separate from `formatDate` in `format.ts` on purpose: the marketing and
 * student surfaces want a spelled-out month and an empty string for a missing
 * date, while every business table is dense and wants `en-GB` numerics with an
 * em dash so a blank cell still reads as a cell.
 */

/** `31/12/2026`, or `—` when there is no usable date. */
export function formatBusinessDate(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? d.toLocaleDateString("en-GB") : "—";
}

/** As `formatBusinessDate`, but blank rather than an em dash — for CSV cells. */
export function formatBusinessDateBlank(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? d.toLocaleDateString("en-GB") : "";
}

/** `31 December 2026` — for detail panes, where there is room. */
export function formatBusinessDateLong(value?: string | Date | null): string {
  const d = toDate(value);
  return d
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";
}

/** `31/12/2026, 14:05`, or `Never` — the only sensible blank for a last-seen. */
export function formatBusinessDateTime(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? d.toLocaleString("en-GB") : "Never";
}

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
