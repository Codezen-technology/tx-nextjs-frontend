import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { paginate, decodeEntities } from "@/lib/api/parsers";
import { normalizeCourse } from "@/lib/services/courses";
import type { Bundle, BundleDetail, BundleImage, BundlePricing } from "@/types/bundle";
import type { PaginatedResponse } from "@/types/api";

interface RawBundlePricing {
  price?: number | string | null;
  regular_price?: number | string | null;
  sale_price?: number | string | null;
  is_on_sale?: boolean;
  currency?: string;
  price_html?: string;
}

export interface RawBundle {
  id: number;
  slug: string;
  title?: string;
  excerpt?: string;
  image?: BundleImage | null;
  pricing?: RawBundlePricing;
  rating?: { average?: number; count?: number };
  included_courses_count?: number;
  courses_preview?: Array<{ id: number; title: string; slug: string }>;
  // detail-only
  content?: string;
  objectives?: string | null;
  standards?: string | null;
  course_for?: string | null;
  faq?: Array<{ question: string; answer: string }>;
  included_courses?: Record<string, unknown>[];
  included_courses_cards?: Array<{ title?: string; short_description?: string }>;
  total_duration_seconds?: number;
  total_duration_hours?: number;
  cpd_points?: number;
  benefits?: string[];
  last_update?: string | null;
}

const toNum = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
};

function normalizePricing(raw?: RawBundlePricing): BundlePricing {
  return {
    price: toNum(raw?.price),
    regularPrice: toNum(raw?.regular_price),
    salePrice: toNum(raw?.sale_price),
    isOnSale: Boolean(raw?.is_on_sale),
    currency: raw?.currency ?? "GBP",
    priceHtml: raw?.price_html ?? "",
  };
}

export function normalizeBundle(raw: RawBundle): Bundle {
  return {
    id: raw.id,
    slug: raw.slug,
    title: decodeEntities(raw.title ?? ""),
    excerpt: decodeEntities(raw.excerpt ?? ""),
    image: raw.image ?? null,
    pricing: normalizePricing(raw.pricing),
    rating: {
      average: Number(raw.rating?.average ?? 0),
      count: Number(raw.rating?.count ?? 0),
    },
    includedCoursesCount: Number(raw.included_courses_count ?? 0),
    coursesPreview: (raw.courses_preview ?? []).map((c) => ({
      id: c.id,
      title: decodeEntities(c.title),
      slug: c.slug,
    })),
  };
}

export function normalizeBundleDetail(raw: RawBundle): BundleDetail {
  return {
    ...normalizeBundle(raw),
    content: raw.content ?? "",
    objectives: raw.objectives ?? null,
    standards: raw.standards ?? null,
    courseFor: raw.course_for ?? null,
    faq: (raw.faq ?? []).map((f) => ({
      question: decodeEntities(f.question),
      answer: f.answer,
    })),
    includedCourses: (raw.included_courses ?? []).map((c) =>
      normalizeCourse(c as unknown as Parameters<typeof normalizeCourse>[0]),
    ),
    includedCoursesCards: (raw.included_courses_cards ?? []).map((c) => ({
      title: decodeEntities(c.title ?? ""),
      shortDescription: decodeEntities(c.short_description ?? ""),
    })),
    totalDurationSeconds: Number(raw.total_duration_seconds ?? 0),
    totalDurationHours: Number(raw.total_duration_hours ?? 0),
    cpdPoints: Number(raw.cpd_points ?? 0),
    benefits: raw.benefits ?? [],
    lastUpdate: raw.last_update ?? null,
  };
}

export const bundlesService = {
  async list(
    params: { page?: number; perPage?: number; search?: string } = {},
  ): Promise<PaginatedResponse<Bundle>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 12;
    const query: Record<string, string | number> = { page, per_page: perPage };
    if (params.search) query.search = params.search;

    const res = await api.get<{ items?: RawBundle[] } | RawBundle[]>(endpoints.bundles.list, {
      params: query,
    });
    const parsed = paginate<RawBundle>(res, page, perPage);
    return { ...parsed, items: parsed.items.map(normalizeBundle) };
  },

  async featured(limit = 4): Promise<Bundle[]> {
    const res = await api.get<{ items?: RawBundle[] }>(endpoints.bundles.featured, {
      params: { limit },
    });
    const items = res.data?.items ?? [];
    return items.map(normalizeBundle);
  },

  async getById(id: number): Promise<BundleDetail> {
    const { data } = await api.get<RawBundle>(endpoints.bundles.detail(id));
    return normalizeBundleDetail(data);
  },

  async getBySlug(slug: string): Promise<BundleDetail> {
    const { data } = await api.get<RawBundle>(endpoints.bundles.bySlug(slug));
    return normalizeBundleDetail(data);
  },
};
