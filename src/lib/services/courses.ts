import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { paginate, decodeEntities } from "@/lib/api/parsers";
import type {
  Course,
  CourseCategory,
  CourseAccreditation,
  CourseExpert,
  CourseBreadcrumb,
  CourseCurriculum,
  CourseDetail,
  CourseListFilters,
  CourseSection,
  CourseSections,
  CourseReviews,
  CourseRichData,
} from "@/types/course";
import type { UnitSummary } from "@/types/unit";
import type { PaginatedResponse, WpRendered } from "@/types/api";

interface RawInstructor {
  id: number;
  name?: string;
  display_name?: string;
  avatar?: string;
  avatar_url?: string;
  bio?: string;
}

interface RawCourse {
  id: number;
  product_id?: number | null;
  slug?: string;
  name?: string;
  title?: string | WpRendered;
  excerpt?: string | WpRendered;
  description?: string;
  content?: string | WpRendered;
  // Real API: { full: string } object; legacy: plain string
  featured_image?: string | { full?: string; thumbnail?: string; medium?: string } | null;
  image?: string;
  thumbnail?: string;
  featured_media_url?: string;
  price?: number | string | null;
  original_price?: number | string | null;
  regular_price?: number | string | null;
  compare_at_price?: number | string | null;
  price_display?: string | null;
  is_free?: boolean;
  free?: boolean;
  level?: string;
  // Real API: seconds number; may be null
  duration?: number | null;
  duration_seconds?: number | null;
  total_duration?: number | null;
  lessons_count?: number;
  units_count?: number;
  total_lessons?: number;
  total_units?: number;
  // Real API field name
  modules_count?: number;
  total_students?: number;
  students_count?: number;
  // Real API uses average_rating
  average_rating?: number;
  rating?: number;
  rating_count?: number;
  categories?: CourseCategory[] | { id: number; name: string; slug: string }[];
  levels?: { id: number; name: string; slug: string }[];
  tags?: { id: number; name: string; slug: string }[];
  // Real API: array of instructors
  instructors?: RawInstructor[];
  // Real API: single primary instructor
  primary_instructor?: RawInstructor;
  // Legacy single instructor field
  instructor?: RawInstructor;
  author?: RawInstructor;
  // Real API: Unix timestamps (numbers); legacy: ISO strings
  date_created?: string | number;
  date_modified?: string | number;
  date?: string;
  date_gmt?: string;
  modified?: string;
  modified_gmt?: string;
  status?: string;
  menu_order?: number;
  seats?: number | null;
  start_date?: string | number | null;
}

const renderedOrString = (v: unknown): string => {
  if (!v) return "";
  if (typeof v === "string") return decodeEntities(v);
  if (typeof v === "object" && v !== null && "rendered" in v) {
    return decodeEntities((v as WpRendered).rendered);
  }
  return "";
};

function normalizeUnitSummaryFromCurriculum(raw: Record<string, unknown>): UnitSummary {
  const id = Number(raw.id);
  const title = renderedOrString(raw.title) || "Unit";
  return {
    id: Number.isFinite(id) ? id : 0,
    slug: typeof raw.slug === "string" ? raw.slug : undefined,
    title,
    type: raw.type as UnitSummary["type"],
    durationSeconds:
      (raw.duration_seconds as number | undefined) ?? (raw.duration as number | undefined),
    isCompleted: raw.is_completed as boolean | undefined,
    isFreePreview: (raw.is_free_preview as boolean | undefined) ?? (raw.free_preview as boolean),
    order: raw.order as number | undefined,
  };
}

function featuredImageUrl(raw: RawCourse): string | undefined {
  const fi = raw.featured_image;
  if (!fi) return raw.featured_media_url ?? raw.image ?? raw.thumbnail ?? undefined;
  if (typeof fi === "string") return fi || undefined;
  // Real API: { full, medium, thumbnail }
  return fi.full ?? fi.medium ?? fi.thumbnail ?? undefined;
}

function toPrice(v: number | string | null | undefined): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : undefined;
}

function toUnixIso(v: string | number | null | undefined): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return new Date(v * 1000).toISOString();
  return v || undefined;
}

function normalizeInstructor(raw: RawInstructor) {
  return {
    id: raw.id,
    name: raw.display_name ?? raw.name ?? "Instructor",
    avatar: raw.avatar_url ?? raw.avatar,
    bio: raw.bio,
  };
}

export function normalizeCourse(raw: RawCourse): Course {
  const price = toPrice(raw?.price);
  const originalPrice =
    toPrice(raw?.original_price) ?? toPrice(raw?.regular_price) ?? toPrice(raw?.compare_at_price);

  // Instructor: real API uses instructors[] + primary_instructor; legacy uses instructor
  const instructorRaw =
    raw?.primary_instructor ?? raw?.instructors?.[0] ?? raw?.instructor ?? raw?.author;

  const productId =
    raw?.product_id != null && Number(raw.product_id) > 0 ? Number(raw.product_id) : null;

  return {
    id: raw?.id,
    product_id: productId,
    slug: raw?.slug ?? String(raw?.id),
    title: renderedOrString(raw?.title) || raw?.name || "Untitled",
    excerpt: renderedOrString(raw?.excerpt) || raw?.description,
    content: renderedOrString(raw?.content),
    featuredImage: featuredImageUrl(raw),
    price,
    originalPrice:
      originalPrice !== undefined && originalPrice !== price ? originalPrice : undefined,
    isFree: raw?.is_free ?? raw?.free ?? (price !== undefined ? price === 0 : undefined),
    level: (raw?.level as Course["level"]) ?? undefined,
    // Real API: duration in seconds (may be null)
    durationSeconds: raw?.duration_seconds ?? raw?.duration ?? raw?.total_duration ?? undefined,
    unitsCount: raw?.units_count ?? raw?.lessons_count ?? raw?.total_units ?? raw?.total_lessons,
    lessonsCount: raw?.lessons_count ?? raw?.total_lessons ?? raw?.units_count ?? raw?.total_units,
    modules_count: typeof raw?.modules_count === "number" ? raw.modules_count : undefined,
    // Real API field is total_students
    studentsCount: raw?.total_students ?? raw?.students_count,
    // Real API field is average_rating
    rating: raw?.average_rating ?? raw?.rating,
    ratingCount: raw?.rating_count,
    categories: raw?.categories as CourseCategory[] | undefined,
    instructor: instructorRaw ? normalizeInstructor(instructorRaw) : undefined,
    // Real API: Unix timestamps; legacy: ISO strings
    createdAt: toUnixIso(raw?.date_created) ?? toUnixIso(raw?.date_gmt) ?? toUnixIso(raw?.date),
    updatedAt:
      toUnixIso(raw?.date_modified) ?? toUnixIso(raw?.modified_gmt) ?? toUnixIso(raw?.modified),
  };
}

/** WooCommerce product ID for cart/checkout — from API root or nested pricing. */
export function resolveCourseProductId(
  course: Pick<CourseRichData, "product_id" | "pricing">,
): number | null {
  if (course.product_id != null && course.product_id > 0) {
    return course.product_id;
  }
  const fromPricing = course.pricing?.product_id;
  if (fromPricing != null && fromPricing > 0) {
    return fromPricing;
  }
  return null;
}

export function normalizeRichCourse(raw: Record<string, unknown>): CourseRichData {
  const base = normalizeCourse(raw as unknown as RawCourse);

  const rawDuration = raw.duration;
  const duration =
    rawDuration && typeof rawDuration === "object" && "value" in (rawDuration as object)
      ? (rawDuration as { value: number; unit: string })
      : null;

  const rawPricing = raw.pricing as Record<string, unknown> | null | undefined;
  const pricingProductId =
    rawPricing?.product_id != null && Number(rawPricing.product_id) > 0
      ? Number(rawPricing.product_id)
      : null;

  const pricing = rawPricing
    ? {
        product_id: pricingProductId,
        regular_price: Number(rawPricing.regular_price ?? 0),
        sale_price: Number(rawPricing.sale_price ?? 0),
        price: Number(rawPricing.price ?? 0),
        is_on_sale: Boolean(rawPricing.is_on_sale),
        currency: String(rawPricing?.currency ?? "GBP"),
        price_html: String(rawPricing?.price_html ?? ""),
        sale_price_html: String(rawPricing?.sale_price_html ?? ""),
      }
    : null;

  const productId = base.product_id ?? pricingProductId ?? null;

  return {
    ...base,
    product_id: productId,
    duration,
    pricing,
    accreditations: Array.isArray(raw.accreditations)
      ? (raw.accreditations as CourseAccreditation[])
      : [],
    experts: Array.isArray(raw.experts) ? (raw.experts as CourseExpert[]) : [],
    badges: Array.isArray(raw.badges) ? (raw.badges as string[]) : [],
    cpd_points: typeof raw.cpd_points === "number" ? raw.cpd_points : undefined,
    breadcrumb: Array.isArray(raw.breadcrumb) ? (raw.breadcrumb as CourseBreadcrumb[]) : [],
    announcement:
      typeof raw.announcement === "string" && raw.announcement ? raw.announcement : null,
    video_url: typeof raw.video_url === "string" && raw.video_url ? raw.video_url : null,
    course_type: typeof raw.course_type === "string" ? raw.course_type : undefined,
  };
}

export const coursesService = {
  async list(filters: CourseListFilters = {}): Promise<PaginatedResponse<Course>> {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 12;
    const params: Record<string, string | number> = { page, per_page: perPage };
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.level) params.level = filters.level;
    if (filters.orderBy) params.orderby = filters.orderBy;
    if (filters.order) params.order = filters.order;

    const res = await api.get<
      | RawCourse[]
      | { items?: RawCourse[]; data?: RawCourse[]; total?: number; total_pages?: number }
    >(endpoints.courses.list, { params });
    const parsed = paginate<RawCourse>(res, page, perPage);
    return {
      ...parsed,
      items: parsed.items.map(normalizeCourse),
    };
  },

  async detail(idOrSlug: string | number): Promise<CourseDetail> {
    const { data } = await api.get<RawCourse>(endpoints.courses.detail(idOrSlug));
    return normalizeCourse(data);
  },

  async curriculum(idOrSlug: string | number): Promise<CourseCurriculum> {
    type NestedShape = {
      sections?: Array<{
        id: number | string;
        title: string;
        lessons?: Record<string, unknown>[];
        units?: Record<string, unknown>[];
      }>;
      data?: Array<{
        id: number | string;
        title: string;
        lessons?: Record<string, unknown>[];
        units?: Record<string, unknown>[];
      }>;
      total_lessons?: number;
      total_units?: number;
      course_id?: number;
    };

    // The lms-backend `/courses/{id}/curriculum` endpoint returns a FLAT array:
    // section markers ({ id: null, type: "section" }) interleaved with unit/quiz
    // items ({ id: number, type: "unit" | "quiz", ... }). Older/alternate shapes
    // nest units under `sections[].units`, so we tolerate both.
    const { data } = await api.get<Array<Record<string, unknown>> | NestedShape>(
      endpoints.courses.curriculum(idOrSlug),
    );

    const sections: CourseSection[] = [];

    if (Array.isArray(data)) {
      let current: CourseSection | null = null;
      for (const item of data) {
        const type = (item as { type?: string }).type;
        const rawId = (item as { id?: unknown }).id;
        const isSection = type === "section" || rawId == null;

        if (isSection) {
          current = {
            id: sections.length,
            title: renderedOrString((item as { title?: unknown }).title) || "Section",
            units: [],
          };
          sections.push(current);
          continue;
        }

        if (!current) {
          current = { id: sections.length, title: "", units: [] };
          sections.push(current);
        }
        current.units.push(normalizeUnitSummaryFromCurriculum(item as Record<string, unknown>));
      }

      return {
        courseId: Number(idOrSlug) || 0,
        sections,
        totalUnits: sections.reduce((acc, s) => acc + s.units.length, 0),
      };
    }

    const rawSections = data.sections ?? data.data ?? [];
    for (const sec of rawSections) {
      const items = (sec.units ?? sec.lessons ?? []) as Record<string, unknown>[];
      sections.push({
        id: sec.id,
        title: sec.title,
        units: items.map(normalizeUnitSummaryFromCurriculum),
      });
    }

    const totalUnits =
      data.total_units ??
      data.total_lessons ??
      sections.reduce((acc, s) => acc + s.units.length, 0);

    return {
      courseId: data.course_id ?? (Number(idOrSlug) || 0),
      sections,
      totalUnits,
    };
  },

  async featured(perPage = 8): Promise<PaginatedResponse<Course>> {
    const params = { per_page: perPage, page: 1 };
    const res = await api.get<RawCourse[] | { items?: RawCourse[]; total?: number }>(
      endpoints.courses.featured,
      { params },
    );
    const parsed = paginate<RawCourse>(res, 1, perPage);
    return { ...parsed, items: parsed.items.map(normalizeCourse) };
  },

  async sections(idOrSlug: string | number): Promise<CourseSections> {
    const { data } = await api.get<CourseSections>(endpoints.courses.sections(idOrSlug));
    return data ?? {};
  },

  async reviews(idOrSlug: string | number): Promise<CourseReviews> {
    const { data } = await api.get<CourseReviews>(
      endpoints.reviews.courseReviews(Number(idOrSlug)),
    );
    return data;
  },

  async related(idOrSlug: string | number, perPage = 6): Promise<PaginatedResponse<Course>> {
    const res = await api.get<RawCourse[] | { items?: RawCourse[]; total?: number }>(
      endpoints.courses.related(idOrSlug),
      { params: { per_page: perPage } },
    );
    const parsed = paginate<RawCourse>(res, 1, perPage);
    return { ...parsed, items: parsed.items.map(normalizeCourse) };
  },

  async richDetail(idOrSlug: string | number): Promise<CourseRichData> {
    const { data } = await api.get<Record<string, unknown>>(endpoints.courses.detail(idOrSlug));
    return normalizeRichCourse(data);
  },

  async categories(): Promise<CourseCategory[]> {
    const res = await api.get<{ items: CourseCategory[] } | CourseCategory[]>(
      endpoints.taxonomy.courseCategories,
    );
    const body = res.data;
    // After unwrapLmsEnvelope the body is { items, total, ... } from paginated_success.
    if (body && !Array.isArray(body) && "items" in body) {
      return (body as { items: CourseCategory[] }).items ?? [];
    }
    return (body as CourseCategory[]) ?? [];
  },
};
