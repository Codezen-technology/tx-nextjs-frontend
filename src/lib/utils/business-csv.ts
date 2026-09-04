export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TEMPLATE_CSV = `First name,Last name,Email address
Ayan,Ahmed,ayan.ahmed@example.co.uk
Lena,Brooks,lena.brooks@example.co.uk
`;

/**
 * What a spreadsheet column becomes. `dept` is parsed but not yet sent —
 * assigning departments needs `POST /departments/members/{id}`, which the
 * facade does not have (docs/B2B_API_GAPS.md cluster 3).
 */
export type ColumnRole = "first" | "last" | "email" | "dept" | "skip";

export const COLUMN_ROLES: ColumnRole[] = ["first", "last", "email", "skip"];

export const COLUMN_ROLE_LABELS: Record<ColumnRole, string> = {
  first: "First name",
  last: "Last name",
  email: "Email address",
  dept: "Department",
  skip: "Skip this column",
};

export interface ImportRow {
  first: string;
  last: string;
  email: string;
  dept: string;
}

/**
 * Deliberately naive: splits on commas, so quoted cells containing commas are
 * not supported. The template we hand out never produces them.
 */
export function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
}

const HEADER_ROLES: Record<string, ColumnRole> = {
  first: "first",
  firstname: "first",
  last: "last",
  lastname: "last",
  surname: "last",
  email: "email",
  emailaddress: "email",
  department: "dept",
  dept: "dept",
};

const normalizeHeader = (cell: string) => cell.toLowerCase().replace(/[^a-z]/g, "");

/** A row is a header only if every non-empty cell names a known column. */
export function detectHeaderRow(row: string[]): boolean {
  const cells = row.filter(Boolean).map(normalizeHeader);
  return cells.length > 1 && cells.every((cell) => cell in HEADER_ROLES);
}

export function mappingFromHeader(row: string[]): ColumnRole[] {
  return row.map((cell) => HEADER_ROLES[normalizeHeader(cell)] ?? "skip");
}

export function defaultMapping(width: number): ColumnRole[] {
  const positional: ColumnRole[] = ["first", "last", "email", "dept"];
  return Array.from({ length: width }, (_, i) => positional[i] ?? "skip");
}

/** First column mapped to a role wins if the same role is picked twice. */
export function buildImportRows(rows: string[][], mapping: ColumnRole[]): ImportRow[] {
  return rows.map((row) => {
    const rec: ImportRow = { first: "", last: "", email: "", dept: "" };
    mapping.forEach((role, i) => {
      if (role !== "skip" && !rec[role]) {
        rec[role] = (row[i] ?? "").trim();
      }
    });
    return rec;
  });
}

export type ImportRowStatus = "added" | "skipped";

export interface ImportResultRow {
  row: number;
  email: string;
  status: ImportRowStatus;
  message?: string;
}

/**
 * Download rows as a CSV file.
 *
 * RFC 4180 escaping: a field containing a quote, comma or newline is wrapped in
 * quotes with its own quotes doubled. Without this a learner name like
 * `Smith, John` would silently split into two columns.
 */
export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const escape = (value: string) =>
    /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
