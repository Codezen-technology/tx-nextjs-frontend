import type { AxiosResponse } from "axios";
import type { PaginatedResponse } from "@/types/api";

/**
 * Builds a PaginatedResponse<T> out of an Axios response. WP REST APIs
 * traditionally surface pagination via the `X-WP-Total` and `X-WP-TotalPages`
 * response headers, but custom LMS endpoints sometimes return an envelope
 * `{ items, total, total_pages }` instead. We tolerate both.
 */
type ListEnvelope<T> = {
  items?: T[];
  data?: T[];
  total?: number;
  total_pages?: number;
  totalPages?: number;
  page?: number;
  per_page?: number;
  perPage?: number;
};

export function paginate<T>(
  res: AxiosResponse<T[] | ListEnvelope<T>>,
  fallbackPage = 1,
  fallbackPerPage = 12,
): PaginatedResponse<T> {
  const data = res.data as T[] | ListEnvelope<T>;

  let items: T[] = [];
  let total: number | undefined;
  let totalPages: number | undefined;
  let page = fallbackPage;
  let perPage = fallbackPerPage;

  if (Array.isArray(data)) {
    items = data;
  } else {
    items = (data.items ?? data.data ?? []) as T[];
    total = data.total;
    totalPages = data.total_pages ?? data.totalPages;
    if (typeof data.page === "number") page = data.page;
    const pp = data.per_page ?? data.perPage;
    if (typeof pp === "number") perPage = pp;
  }

  const headerTotal = Number(res.headers["x-wp-total"]);
  const headerTotalPages = Number(res.headers["x-wp-totalpages"]);

  return {
    items,
    total: total ?? (Number.isFinite(headerTotal) ? headerTotal : items.length),
    totalPages:
      totalPages ?? (Number.isFinite(headerTotalPages) ? headerTotalPages : 1),
    page,
    perPage,
  };
}

/** Decode HTML entities returned by WordPress / WooCommerce REST APIs. */
export function decodeEntities(s: string | undefined | null): string {
  if (!s) return "";

  let out = s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    });

  out = out
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#038;/g, "&")
    .replace(/&#036;/g, "$")
    .replace(/&#8230;/g, "\u2026")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&nbsp;/g, " ");

  return out;
}
