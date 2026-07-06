/**
 * Normalize a headless form date value for Gravity Forms `ymd_dash` fields (yyyy-mm-dd).
 * Handles HTML5 date strings, ISO datetimes, slash/dot typing, and trims whitespace.
 */
export function toGravityDateString(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  if (!raw) return undefined;

  const isoPrefix = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];

  const normalized = raw.replace(/[/.]/g, "-");
  const parts = normalized.split("-").map((p) => p.trim());
  if (parts.length !== 3) return raw;

  const [a, b, c] = parts;
  if (a.length === 4) {
    return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
  }

  // Typed dd/mm/yyyy or mm/dd/yyyy — prefer en-GB (dd/mm) for this site.
  const year = c.length === 2 ? `20${c}` : c;
  const day = a.padStart(2, "0");
  const month = b.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Client-side check before submit (matches GF ymd_dash). */
export function isValidGravityDate(value: unknown): boolean {
  const normalized = toGravityDateString(value);
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false;
  const [y, m, d] = normalized.split("-").map(Number);
  if (!y || !m || !d) return false;
  return (
    new Date(y, m - 1, d).getFullYear() === y &&
    new Date(y, m - 1, d).getMonth() === m - 1 &&
    new Date(y, m - 1, d).getDate() === d
  );
}
