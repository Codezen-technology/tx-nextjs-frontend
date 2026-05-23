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
}

export interface CourseSections {
  what_you_will_learn?: string[] | null;
  description_heading?: string | null;
  at_a_glance?: string | null;
  who_should_take?: { summary: string; items: string[] } | null;
  why_take?: string | null;
  requirements?: string | null;
  assessment?: string | null;
  faq?: { question: string; answer: string }[] | null;
  faq_heading?: string | null;
  screenshots?: string[] | null;
  job_opportunities?: { heading: string; items: { title: string; description: string }[] } | null;
}

export interface CourseFlatCurriculumItem {
  id: number | null;
  title: string;
  type: "section" | "unit" | "quiz";
  section_duration?: number;
  unit_count?: number;
  icon?: string;
  duration?: number | null;
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
