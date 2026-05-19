/**
 * Server-only fetcher for React Server Components.
 *
 * Rules:
 *  - Never import this in Client Components (no "use client" at the top of files that use it).
 *  - Uses native `fetch` — NOT axios — so Next.js caching works.
 *  - Always tag fetches so on-demand revalidation via /api/revalidate is precise.
 *  - Throws `ServerFetchError` on non-2xx so RSC can call `notFound()` or `error.tsx`.
 */

import { coursePath } from "@/lib/api/endpoints";
import { getServerWpJsonBase, env } from "@/lib/env";
import type { FooterData } from "@/types/settings";
import type { CourseSections } from "@/types/course";

const lms = `/${env.LMS_NAMESPACE}`;

export class ServerFetchError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ServerFetchError";
  }
}

export interface FetchOptions {
  /** ISR revalidation interval in seconds. Pass `0` for force-dynamic, `false` for no-store. */
  revalidate?: number | false;
  /** Cache tags for on-demand revalidation via `revalidateTag()`. */
  tags?: string[];
  /** Extra request headers. */
  headers?: Record<string, string>;
}

// ─── Raw API shapes (what the backend returns after envelope unwrap) ──────────

/** Shared pagination wrapper — matches Abstract_Controller::paginated_success() */
export type ApiPaginated<T> = {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  totalPages: number;
};

/** Course status label — maps numeric WPLMS status codes to strings */
export type ApiStatusLabel = "start_course" | "continue_course" | "under_evaluation" | "evaluated";

// ── Taxonomy ──────────────────────────────────────────────────────────────────

/** format_term() in Taxonomy_Controller */
export type ApiTerm = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
};

/** format_category() — ApiTerm + image field */
export type ApiCategory = ApiTerm & { image: string | null };

// ── Course ────────────────────────────────────────────────────────────────────

/** Instructor summary embedded in Course_Model::to_array() */
export type ApiCourseInstructor = {
  id: number;
  display_name: string;
  email: string;
  avatar: string;
};

/** featured_image from Course_Model — full object when thumbnail exists, slim when fallback */
export type ApiCourseFeaturedImage =
  | { id: number; full: string; large: string; thumb: string }
  | { full: string }
  | null;

/** Full shape of Course_Model::to_array() */
export type ApiCourse = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: string;
  date_created: number | null;
  date_modified: number | null;
  featured_image: ApiCourseFeaturedImage;
  price: number | null;
  price_display: string | null;
  is_free: boolean;
  total_students: number;
  seats: number | null;
  average_rating: number;
  rating_count: number;
  duration: { value: number; unit: string } | null;
  start_date: number | null;
  categories: Array<{ id: number; slug: string; name: string }>;
  levels: Array<{ id: number; slug: string; name: string }>;
  tags: Array<{ id: number; slug: string; name: string }>;
  instructors: ApiCourseInstructor[];
  primary_instructor: ApiCourseInstructor | null;
  author: ApiCourseInstructor | null;
  menu_order: number;
};

/**
 * Curriculum item from Courses_Controller::get_curriculum().
 * Sections have id=null; units/quizzes have numeric id.
 */
export type ApiCurriculumItem =
  | { id: null; title: string; type: "section" }
  | { id: number; title: string; type: "unit" | "quiz" | string };

// ── User ──────────────────────────────────────────────────────────────────────

/** User_Model::to_array() */
export type ApiUser = {
  id: number;
  username: string;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  avatar: string;
  roles: string[];
  capabilities: string[];
  enrolled_courses: number;
  registered_at: string;
};

// ── Reviews ───────────────────────────────────────────────────────────────────

/** prepare_review_item() in Reviews_Controller */
export type ApiReview = {
  id: number;
  course_id: number;
  user_id: number;
  author: { id: number; name: string; avatar: string };
  /** comment meta `review_title` — false/empty string when not set */
  title: string | false;
  content: string;
  rating: number;
  created_at: string;
  status: string;
};

/** get_course_reviews() response */
export type ApiCourseReviews = {
  course_id: number;
  reviews: ApiReview[];
  total_reviews: number;
  average_rating: number;
  rating_breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
};

// ── Progress ──────────────────────────────────────────────────────────────────

/** Progress summary built by Progress_Controller::build_progress_summary() */
export type ApiProgressSummary = {
  course_id: number;
  user_id: number;
  status: number | string | null;
  status_label: ApiStatusLabel | null;
  completed: boolean;
  completion_rate: number;
  course_title: string;
  course_link: string;
};

/** Per-unit entry from Progress_Controller::get_unit_progress() */
export type ApiProgressUnit =
  | { type: "section"; title: string; id: null }
  | {
      id: number;
      title: string;
      type: "unit" | "quiz";
      completed: boolean;
      completed_at: number | null;
    };

/** get_course_progress() = summary + units array */
export type ApiCourseProgress = ApiProgressSummary & { units: ApiProgressUnit[] };

// ── Enrollment ────────────────────────────────────────────────────────────────

/** Enrollments_Controller::get_my_enrollments() item (Enrollment_Model + title/link) */
export type ApiEnrollmentItem = {
  user_id: number;
  course_id: number;
  is_enrolled: boolean;
  status: number | string | null;
  status_label: ApiStatusLabel | null;
  enrolled_at: number | null;
  title: string;
  link: string;
};

// ── Units ─────────────────────────────────────────────────────────────────────

/** Unit_Model::to_array() */
export type ApiUnit = {
  id: number;
  title: string;
  excerpt: string;
  type: string;
  course_id: number | null;
  duration: number | null;
  preview: boolean;
};

/** Units_Controller::get_content() */
export type ApiUnitContent = { id: number; content: string };

/** Units_Controller::mark_complete() */
export type ApiUnitComplete = {
  unit_id: number;
  course_id: number;
  completed: boolean;
  completed_at: number;
};

// ── Quizzes ───────────────────────────────────────────────────────────────────

/** Quiz_Model::to_array() */
export type ApiQuiz = {
  id: number;
  title?: string;
  excerpt?: string;
  content?: string;
  duration: number | null;
  max_marks: number | null;
  passing_marks: number | null;
  course_id: number | null;
};

/** Quizzes_Controller::get_questions() item */
export type ApiQuizQuestion = { id: number; title: string; type: string };

/** Quizzes_Controller::start_quiz() */
export type ApiQuizAttempt = {
  attempt_id: string;
  quiz_id: number;
  course_id: number | null;
  status: "in_progress";
};

/** Quizzes_Controller::get_results() / submit_quiz() */
export type ApiQuizResult = {
  attempt_id: string | null;
  quiz_id: number;
  score: number | null;
  max_score: number | null;
  passed: boolean;
  status: string;
  started_at: number | null;
  completed_at: number | null;
};

// ── Assignments ───────────────────────────────────────────────────────────────

/** Assignments_Controller::prepare_item() */
export type ApiAssignment = {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  course_id: string | null;
  max_marks: string | null;
  duration: string | null;
  upload_enable: string | null;
  due_date: string | null;
  created_at: string;
  modified_at: string;
};

/** get_submission_status() when not submitted */
export type ApiAssignmentStatusEmpty = {
  submitted: false;
  status: "not_submitted";
  submission: null;
};

/** get_submission_status() when submitted */
export type ApiAssignmentStatusFilled = {
  submitted: true;
  submission_id: number;
  status: string;
  submitted_date: string;
  marks: string | null;
  feedback: string | null;
};

export type ApiAssignmentStatus = ApiAssignmentStatusEmpty | ApiAssignmentStatusFilled;

// ── Settings ──────────────────────────────────────────────────────────────────

export type ApiSettings = Record<string, unknown>;

// ─── Core fetch helpers ───────────────────────────────────────────────────────

/** Resolve a WP REST path (starting with /) to a full URL using the server-side WP base. */
function resolveUrl(path: string): string {
  const base = getServerWpJsonBase();
  if (!base) throw new ServerFetchError(0, "misconfigured", "NEXT_PUBLIC_WP_API_URL is not set.");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildNextCache(opts: FetchOptions): RequestInit["next"] {
  const next: Record<string, unknown> = {};
  if (typeof opts.revalidate === "number") next.revalidate = opts.revalidate;
  if (opts.revalidate === false) next.revalidate = 0;
  if (opts.tags?.length) next.tags = opts.tags;
  return next as RequestInit["next"];
}

/** Unwrap `{ success, data }` envelope if present; otherwise return body as-is. */
function unwrapEnvelope<T>(body: unknown): T {
  if (body && typeof body === "object" && "success" in body) {
    const env = body as { success?: boolean; data?: unknown; message?: string; code?: string };
    if (env.success === false) {
      throw new ServerFetchError(422, env.code ?? "api_error", env.message ?? "Request failed");
    }
    return (env.data ?? null) as T;
  }
  return body as T;
}

/**
 * GET a public WordPress REST endpoint.
 * Suitable for courses, categories, blog posts, settings, reviews, etc.
 */
export async function serverFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = resolveUrl(path);
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
    next: buildNextCache(opts),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body as { message?: string; code?: string };
    throw new ServerFetchError(
      res.status,
      err.code ?? "fetch_error",
      err.message ?? `HTTP ${res.status} from WordPress`,
    );
  }

  const body = await res.json();
  return unwrapEnvelope<T>(body);
}

/** Build query string from a params record. */
function qs(params?: Record<string, string | number>): string {
  if (!params) return "";
  return `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`;
}

// ─── serverApi convenience wrappers ──────────────────────────────────────────

export const serverApi = {
  courses: {
    list: (params?: Record<string, string | number>) =>
      serverFetch<ApiPaginated<ApiCourse>>(`${lms}/courses${qs(params)}`, {
        revalidate: 300,
        tags: ["courses:list"],
      }),

    detail: (slug: string) =>
      serverFetch<ApiCourse>(coursePath(slug), {
        revalidate: 600,
        tags: [`course:${slug}`, "courses:list"],
      }),

    curriculum: (slug: string) =>
      serverFetch<ApiCurriculumItem[]>(coursePath(slug, "curriculum"), {
        revalidate: 600,
        tags: [`course:${slug}:curriculum`],
      }),

    richDetail: (slug: string) =>
      serverFetch<Record<string, unknown>>(coursePath(slug), {
        revalidate: 600,
        tags: [`course:${slug}`, "courses:list"],
      }),

    sections: (slug: string) =>
      serverFetch<CourseSections>(coursePath(slug, "sections"), {
        revalidate: 600,
        tags: [`course:${slug}:sections`],
      }),

    related: (slug: string, perPage = 6) =>
      serverFetch<ApiPaginated<ApiCourse>>(
        `${coursePath(slug, "related")}${qs({ per_page: perPage })}`,
        { revalidate: 300, tags: [`course:${slug}:related`] },
      ),

    featured: (perPage?: number) =>
      serverFetch<ApiPaginated<ApiCourse>>(
        `${lms}/courses/featured${qs(perPage ? { per_page: perPage } : undefined)}`,
        { revalidate: 300, tags: ["courses:featured"] },
      ),

    popular: (perPage?: number) =>
      serverFetch<ApiPaginated<ApiCourse>>(
        `${lms}/courses/popular${qs(perPage ? { per_page: perPage } : undefined)}`,
        { revalidate: 300, tags: ["courses:popular"] },
      ),

    free: (params?: Record<string, string | number>) =>
      serverFetch<ApiPaginated<ApiCourse>>(`${lms}/courses/free${qs(params)}`, {
        revalidate: 300,
        tags: ["courses:free"],
      }),
  },

  taxonomy: {
    categories: (params?: Record<string, string | number>) =>
      serverFetch<ApiPaginated<ApiCategory>>(`${lms}/course-categories${qs(params)}`, {
        revalidate: 600,
        tags: ["taxonomy:categories"],
      }),

    levels: (params?: Record<string, string | number>) =>
      serverFetch<ApiPaginated<ApiTerm>>(`${lms}/levels${qs(params)}`, {
        revalidate: 600,
        tags: ["taxonomy:levels"],
      }),

    tags: (params?: Record<string, string | number>) =>
      serverFetch<ApiPaginated<ApiTerm>>(`${lms}/tags${qs(params)}`, {
        revalidate: 600,
        tags: ["taxonomy:tags"],
      }),
  },

  reviews: {
    forCourse: (courseId: string | number) =>
      serverFetch<ApiCourseReviews>(coursePath(courseId, "reviews"), {
        revalidate: 300,
        tags: [`course:${courseId}:reviews`],
      }),

    list: (params?: Record<string, string | number>) =>
      serverFetch<ApiPaginated<ApiReview>>(`${lms}/reviews${qs(params)}`, {
        revalidate: 300,
        tags: ["reviews:list"],
      }),
  },

  blog: {
    posts: (params?: Record<string, string | number>) =>
      serverFetch<unknown[]>(`/wp/v2/posts${qs(params)}`, {
        revalidate: 300,
        tags: ["blog:posts"],
      }),

    post: (slug: string) =>
      serverFetch<unknown[]>(`/wp/v2/posts?slug=${encodeURIComponent(slug)}`, {
        revalidate: 300,
        tags: [`blog:${slug}`],
      }),
  },

  settings: {
    get: () =>
      serverFetch<ApiSettings>(`${lms}/settings`, {
        revalidate: 3600,
        tags: ["settings"],
      }),
  },

  footer: {
    get: () =>
      serverFetch<FooterData>(`${lms}/footer`, {
        revalidate: 3600,
        tags: ["footer"],
      }),
  },

  partners: () =>
    serverFetch<unknown[]>("/wp/v2/partner_logo", { revalidate: 3600, tags: ["partners"] }),

  testimonials: () =>
    serverFetch<unknown[]>("/wp/v2/testimonial", { revalidate: 3600, tags: ["testimonials"] }),
};
