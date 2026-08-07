import type { Unit, UnitSummary } from "./unit";

export interface CourseCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
  parent?: number;
  featuredImage?: string | null;
}

export interface CourseInstructor {
  id: number;
  name: string;
  avatar?: string;
  bio?: string;
}

export type CourseLevel = "beginner" | "intermediate" | "advanced" | "all";

export interface Course {
  id: number;
  /** WooCommerce product ID (`vibe_product` meta). Required for cart/checkout. */
  product_id?: number | null;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  price?: number;
  originalPrice?: number;
  isFree?: boolean;
  level?: CourseLevel;
  durationSeconds?: number;
  /** Curriculum item count (API may still call these "lessons"). */
  unitsCount?: number;
  lessonsCount?: number;
  studentsCount?: number;
  rating?: number;
  ratingCount?: number;
  categories?: CourseCategory[];
  instructor?: CourseInstructor;
  createdAt?: string;
  updatedAt?: string;
  modules_count?: number;
  /** Promotional flags: subset of "bestseller" | "limited_time_offer" | "free_certificate" | "team_training". */
  badges?: string[];
  /** Feature image ribbon badge from `vibe_course_badge_title` meta. */
  feature_img_ribbon?: string | null;
  cpdPoints?: number;
  sale?: CourseSale | null;
}

export interface CourseSale {
  regularPrice: number | null;
  salePrice: number | null;
  isOnSale: boolean;
  /** ISO 8601 datetime the sale ends, or null when no countdown is scheduled. */
  saleEndsAt: string | null;
}

export interface CourseSection {
  id: number | string;
  title: string;
  units: UnitSummary[];
}

export interface CourseCurriculum {
  courseId: number;
  sections: CourseSection[];
  totalUnits: number;
}

export interface CourseDetail extends Course {
  curriculum?: CourseSection[];
  firstUnit?: Unit | UnitSummary;
}

export interface CoursePricing {
  product_id?: number | null;
  regular_price: number;
  sale_price: number;
  price: number;
  is_on_sale: boolean;
  currency: string;
  price_html: string;
  sale_price_html: string;
}

export interface CourseAccreditation {
  slug: string;
  label: string;
  logo: string;
  description: string;
}

export interface CourseExpert {
  id: number;
  title: string;
  image: { full: string; thumb: string };
  designation: string;
  social_url?: string;
  bio?: string;
}

export interface CourseBreadcrumb {
  id: number;
  name: string;
  slug: string;
  url: string;
}

export interface CourseSeo {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: Record<string, unknown>[];
}

export interface CourseRichData extends Course {
  pricing?: CoursePricing | null;
  accreditations?: CourseAccreditation[];
  experts?: CourseExpert[];
  badges?: string[];
  cpd_points?: number;
  breadcrumb?: CourseBreadcrumb[];
  announcement?: string | null;
  video_url?: string | null;
  course_type?: string;
  /** Human-readable duration from API e.g. { value: 8, unit: "hours" } */
  duration?: { value: number; unit: string } | null;
  /** Display-ready duration resolved by the service from `duration` or `durationSeconds`. */
  durationLabel?: string | null;
  /** Parsed Rank Math SEO data — present when WP returns `rank_math_head` field. */
  seo?: CourseSeo;
}

export interface CourseSuitableForItem {
  title: string;
  icon?: string | null;
}

export interface CourseSections {
  /** Sanitized HTML from `what_youll_learn` WYSIWYG field. */
  what_you_will_learn?: string | null;
  description_heading?: string | null;
  at_a_glance?: string | null;
  who_should_take?: { summary: string; items: CourseSuitableForItem[] } | null;
  why_take?: string | null;
  requirements?: string | null;
  assessment?: string | null;
  how_courses_work?: string | null;
  accredited_by?: string | null;
  faq?: { question: string; answer: string }[] | null;
  faq_heading?: string | null;
  screenshots?: string[] | null;
  /** Text from `empower_and_engage.add_text`. */
  sneak_peek_text?: string | null;
  job_opportunities?: { heading: string; items: { title: string; description: string }[] } | null;
}

export interface CourseFlatCurriculumItem {
  id: number | null;
  title: string;
  type: "section" | "unit" | "quiz";
  /** Raw API value, in minutes. Read `durationSeconds` instead. */
  section_duration?: number;
  unit_count?: number;
  icon?: string;
  /** Raw API value, in minutes. Read `durationSeconds` instead. */
  duration?: number | null;
  /** Normalized by `normalizeFlatCurriculum` — seconds, as the formatters expect. */
  durationSeconds?: number;
  is_free_preview?: boolean;
}

export interface CourseReviewItem {
  id: number;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  content: string;
  title?: string;
}

export interface CourseReviews {
  course_id: number;
  average_rating: number;
  total_reviews: number;
  rating_breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
  reviews: CourseReviewItem[];
}

export interface CourseListFilters {
  search?: string;
  category?: string | number;
  level?: CourseLevel;
  page?: number;
  perPage?: number;
  orderBy?: "date" | "title" | "popularity" | "rating";
  order?: "asc" | "desc";
}
