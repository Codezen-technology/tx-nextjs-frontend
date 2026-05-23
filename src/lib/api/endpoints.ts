import { env } from "@/lib/env";

const lms = `/${env.LMS_NAMESPACE}`;
const wp = `/wp/v2`;
const swca = `/swca/v1`;
const wcStore = `/wc/store/v1`;
const wcRest = `/wc/v3`;

/** REST path segment for a course by numeric ID or post slug. */
export function coursePath(idOrSlug: string | number, subpath?: string): string {
  const segment = encodeURIComponent(String(idOrSlug));
  const base =
    typeof idOrSlug === "number" || /^\d+$/.test(String(idOrSlug))
      ? `${lms}/courses/${segment}`
      : `${lms}/courses/slug/${segment}`;
  return subpath ? `${base}/${subpath.replace(/^\//, "")}` : base;
}

/** REST path for a course by post slug only — use on `/course/[slug]` pages. */
export function courseSlugPath(slug: string, subpath?: string): string {
  const base = `${lms}/courses/slug/${encodeURIComponent(slug)}`;
  return subpath ? `${base}/${subpath.replace(/^\//, "")}` : base;
}

export const endpoints = {
  auth: {
    login: `${lms}/auth/login`,
    register: `${lms}/auth/register`,
    logout: `${lms}/auth/logout`,
    refresh: `${lms}/auth/refresh`,
    forgotPassword: `${lms}/auth/forgot-password`,
    resetPassword: `${lms}/auth/reset-password`,
  },
  user: {
    me: `${lms}/users/me`,
    updateMe: `${lms}/users/me`,
    avatar: `${lms}/users/me/avatar`,
    enrollments: `${lms}/users/me/enrollments`,
    progress: `${lms}/users/me/progress`,
    certificates: `${lms}/users/me/certificates`,
    badges: `${lms}/users/me/badges`,
    notifications: `${lms}/users/me/notifications`,
    publicProfile: (id: number) => `${lms}/users/${id}`,
  },
  courses: {
    list: `${lms}/courses`,
    detail: (idOrSlug: string | number) => coursePath(idOrSlug),
    search: `${lms}/courses/search`,
    featured: `${lms}/courses/featured`,
    popular: `${lms}/courses/popular`,
    free: `${lms}/courses/free`,
    curriculum: (idOrSlug: string | number) => coursePath(idOrSlug, "curriculum"),
    sections: (idOrSlug: string | number) => coursePath(idOrSlug, "sections"),
    related: (idOrSlug: string | number) => coursePath(idOrSlug, "related"),
    instructors: (id: number) => `${lms}/courses/${id}/instructors`,
    enroll: (courseId: number) => `${lms}/courses/${courseId}/enroll`,
  },
  units: {
    list: `${lms}/units`,
    detail: (id: number) => `${lms}/units/${id}`,
    content: (id: number) => `${lms}/units/${id}/content`,
    complete: (id: number) => `${lms}/units/${id}/complete`,
  },
  quizzes: {
    list: `${lms}/quizzes`,
    detail: (id: number) => `${lms}/quizzes/${id}`,
    questions: (id: number) => `${lms}/quizzes/${id}/questions`,
    start: (id: number) => `${lms}/quizzes/${id}/start`,
    submit: (id: number) => `${lms}/quizzes/${id}/submit`,
    results: (id: number) => `${lms}/quizzes/${id}/results`,
  },
  assignments: {
    list: `${lms}/assignments`,
    detail: (id: number) => `${lms}/assignments/${id}`,
    submit: (id: number) => `${lms}/assignments/${id}/submit`,
    status: (id: number) => `${lms}/assignments/${id}/status`,
    grade: (id: number) => `${lms}/assignments/${id}/grade`,
  },
  enrollments: {
    enroll: (courseId: number) => `${lms}/courses/${courseId}/enroll`,
    me: `${lms}/users/me/enrollments`,
  },
  progress: {
    all: `${lms}/users/me/progress`,
    course: (courseId: number) => `${lms}/users/me/courses/${courseId}/progress`,
  },
  reviews: {
    list: `${lms}/reviews`,
    courseReviews: (idOrSlug: string | number) => coursePath(idOrSlug, "reviews"),
    mine: `${lms}/reviews/my-reviews`,
    update: (id: number) => `${lms}/reviews/${id}`,
    delete: (id: number) => `${lms}/reviews/${id}`,
  },
  taxonomy: {
    courseCategories: `${lms}/course-categories`,
    tags: `${lms}/tags`,
    levels: `${lms}/levels`,
  },
  cart: {
    get: `${wcStore}/cart`,
    addItem: `${wcStore}/cart/add-item`,
    updateItem: (key: string) => `${wcStore}/cart/items/${key}`,
    removeItem: (key: string) => `${wcStore}/cart/items/${key}`,
    applyCoupon: `${wcStore}/cart/apply-coupon`,
    removeCoupon: `${wcStore}/cart/remove-coupon`,
    empty: `${wcStore}/cart/items`,
  },
  orders: {
    create: `${wcRest}/orders`,
    list: `${wcRest}/orders`,
    detail: (id: number) => `${wcRest}/orders/${id}`,
    pay: (id: number) => `${wcRest}/orders/${id}`,
  },
  payment: {
    gateways: `${wcRest}/payment_gateways`,
  },
  bundles: {
    list: `${lms}/bundles`,
    detail: (id: number) => `${lms}/bundles/${id}`,
    featured: `${lms}/bundles/featured`,
  },
  instructors: {
    list: `${lms}/instructors`,
    detail: (id: number) => `${lms}/instructors/${id}`,
    courses: (id: number) => `${lms}/instructors/${id}/courses`,
    reviews: (id: number) => `${lms}/instructors/${id}/reviews`,
  },
  certificates: {
    verify: `${lms}/certificates/verify`,
    legacyVerify: `${swca}/get-certificate`,
  },
  search: {
    unified: `${lms}/search`,
    suggestions: `${lms}/search/suggestions`,
  },
  media: {
    upload: `${lms}/media`,
    delete: (id: number) => `${lms}/media/${id}`,
  },
  blog: {
    posts: `${wp}/posts`,
    post: (slug: string) => `${wp}/posts?slug=${encodeURIComponent(slug)}`,
    pages: `${wp}/pages`,
    categories: `${wp}/categories`,
  },
  settings: {
    get: `${lms}/settings`,
  },
  footer: {
    get: `${lms}/footer`,
  },
  memberships: {
    plans: `${lms}/memberships/plans`,
    subscribe: `${lms}/memberships/subscribe`,
    cancel: `${lms}/memberships/cancel`,
    myMembership: `${lms}/users/me/membership`,
  },
  partners: {
    list: `${wp}/partner_logo`,
  },
  testimonials: {
    list: `${wp}/testimonial`,
  },
} as const;
