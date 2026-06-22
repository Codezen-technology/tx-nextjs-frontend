import type { CourseListFilters } from "@/types/course";
import type { CertificatesParams, StudentCoursesParams } from "@/types/student-dashboard";

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  settings: {
    promoBanner: ["settings", "promo-banner"] as const,
  },
  courses: {
    all: ["courses"] as const,
    list: (filters: CourseListFilters = {}) => ["courses", "list", filters] as const,
    detail: (slugOrId: string | number) => ["courses", "detail", slugOrId] as const,
    curriculum: (id: number | string) => ["courses", "curriculum", id] as const,
    sections: (id: number | string) => ["courses", "sections", id] as const,
    reviews: (id: number | string) => ["courses", "reviews", id] as const,
    related: (id: number | string) => ["courses", "related", id] as const,
    categories: ["courses", "categories"] as const,
  },
  units: {
    detail: (id: number) => ["units", "detail", id] as const,
  },
  player: {
    status: (courseId: number) => ["player", "status", courseId] as const,
    unit: (courseId: number, unitId: number) => ["player", "unit", courseId, unitId] as const,
    quiz: (courseId: number, quizId: number) => ["player", "quiz", courseId, quizId] as const,
    assignment: (courseId: number, assignmentId: number) =>
      ["player", "assignment", courseId, assignmentId] as const,
    reviews: (courseId: number) => ["player", "reviews", courseId] as const,
    myReview: (courseId: number) => ["player", "my-review", courseId] as const,
  },
  progress: {
    course: (id: number) => ["progress", "course", id] as const,
  },
  enrollments: {
    me: ["enrollments", "me"] as const,
    detail: (id: number) => ["enrollments", "detail", id] as const,
  },
  user: {
    me: ["user", "me"] as const,
  },
  blog: {
    posts: (perPage?: number) => ["blog", "posts", perPage] as const,
  },
  bundles: {
    all: ["bundles"] as const,
    list: (filters: { page?: number; perPage?: number; search?: string } = {}) =>
      ["bundles", "list", filters] as const,
    featured: (limit?: number) => ["bundles", "featured", limit] as const,
    detail: (slugOrId: string | number) => ["bundles", "detail", slugOrId] as const,
  },
  pages: {
    detail: (slug: string) => ["pages", "detail", slug] as const,
    list: (template?: string) => ["pages", "list", template ?? ""] as const,
  },
  cartRules: {
    bulkTiers: ["cart-rules", "bulk-tiers"] as const,
  },
  cart: {
    detail: ["cart"] as const,
  },
  orders: {
    list: ["orders"] as const,
    detail: (id: number, orderKey?: string) => ["orders", "detail", id, orderKey ?? ""] as const,
  },
  payment: {
    methods: ["payment", "methods"] as const,
    gateways: ["payment", "gateways"] as const,
  },
  student: {
    summary: ["student", "summary"] as const,
    courses: (filters: StudentCoursesParams = {}) => ["student", "courses", filters] as const,
    certificates: (filters: CertificatesParams = {}) =>
      ["student", "certificates", filters] as const,
    subscription: ["student", "subscription"] as const,
    orders: (page: number) => ["student", "orders", page] as const,
    order: (id: number) => ["student", "order", id] as const,
    plans: ["student", "plans"] as const,
  },
  admin: {
    colors: ["admin", "colors"] as const,
    navigation: ["admin", "navigation"] as const,
    promos: ["admin", "promos"] as const,
    categories: ["admin", "categories"] as const,
    subscriptionPlanSettings: ["admin", "subscriptionPlanSettings"] as const,
    products: ["admin", "products"] as const,
  },
} as const;
