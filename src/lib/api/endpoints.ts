import { env } from "@/lib/env";

const lms = `/${env.LMS_NAMESPACE}`;
const wp = `/wp/v2`;
const swca = `/swca/v1`;
const wcStore = `/wc/store/v1`;
const wcRest = `/wc/v3`;

/**
 * REST namespace for the B2B business dashboard facade plugin.
 * `proxyToB2B()` prepends it, so `endpoints.business` paths omit it.
 */
export const B2B_NAMESPACE = env.B2B_NAMESPACE;

/** Route param accepted by the B2B path helpers — raw, encoded on the way in. */
type B2BId = string | number;

const seg = (value: B2BId) => `/${encodeURIComponent(String(value))}`;

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
  forms: {
    detail: (id: number | string) => `${lms}/forms/${encodeURIComponent(String(id))}`,
    validate: (id: number | string) => `${lms}/forms/${encodeURIComponent(String(id))}/validate`,
    submit: (id: number | string) => `${lms}/forms/${encodeURIComponent(String(id))}/submissions`,
  },
  certificate: {
    page: `${lms}/certificate/page`,
    config: `${lms}/certificate/config`,
    quote: `${lms}/certificate/quote`,
  },
  auth: {
    login: `${lms}/auth/login`,
    checkoutSession: `${lms}/auth/checkout-session`,
    register: `${lms}/auth/register`,
    social: `${lms}/auth/social`,
    logout: `${lms}/auth/logout`,
    logoutAll: `${lms}/auth/logout-all`,
    refresh: `${lms}/auth/refresh`,
    forgotPassword: `${lms}/auth/forgot-password`,
    resetPassword: `${lms}/auth/reset-password`,
    switchUser: `${lms}/auth/switch-user`,
    switchBack: `${lms}/auth/switch-back`,
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
    // Course-player parity (wraps WPLMS coursestatus / finishcourse).
    playerStatus: (id: number) => `${lms}/courses/${id}/player-status`,
    finish: (id: number) => `${lms}/courses/${id}/finish`,
  },
  units: {
    list: `${lms}/units`,
    detail: (id: number) => `${lms}/units/${id}`,
    content: (id: number) => `${lms}/units/${id}/content`,
    complete: (id: number) => `${lms}/units/${id}/complete`,
    // Course-player parity (full IUnitItem + WPLMS markcomplete).
    playerContent: (id: number, courseId: number) =>
      `${lms}/units/${id}/player-content?course_id=${courseId}`,
    playerComplete: (id: number) => `${lms}/units/${id}/player-complete`,
  },
  quizzes: {
    list: `${lms}/quizzes`,
    detail: (id: number) => `${lms}/quizzes/${id}`,
    questions: (id: number) => `${lms}/quizzes/${id}/questions`,
    start: (id: number) => `${lms}/quizzes/${id}/start`,
    submit: (id: number) => `${lms}/quizzes/${id}/submit`,
    results: (id: number) => `${lms}/quizzes/${id}/results`,
    // Full quiz payload incl. encrypted correct answers (WPLMS bp_wplms_get_quiz_data).
    full: (id: number, courseId: number) => `${lms}/quizzes/${id}/full?course_id=${courseId}`,
  },
  assignments: {
    list: `${lms}/assignments`,
    detail: (id: number) => `${lms}/assignments/${id}`,
    submit: (id: number) => `${lms}/assignments/${id}/submit`,
    status: (id: number) => `${lms}/assignments/${id}/status`,
    grade: (id: number) => `${lms}/assignments/${id}/grade`,
    // Course-player parity (wraps WPLMS assignment endpoints).
    full: (id: number, courseId: number) => `${lms}/assignments/${id}/full?course_id=${courseId}`,
    start: (id: number) => `${lms}/assignments/${id}/start`,
    upload: (id: number) => `${lms}/assignments/${id}/upload`,
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
  products: {
    /** WooCommerce Store API products (public read). Append `?slug=` / `?id=` etc. */
    list: `${wcStore}/products`,
    bySlug: (slug: string) => `${wcStore}/products?slug=${encodeURIComponent(slug)}`,
    detail: (id: number) => `${wcStore}/products/${id}`,
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
    bySlug: (slug: string) => `${lms}/bundles/slug/${encodeURIComponent(slug)}`,
    featured: `${lms}/bundles/featured`,
  },
  pages: {
    list: `${lms}/pages`,
    byTemplate: (template: string) => `${lms}/pages?template=${encodeURIComponent(template)}`,
    detail: (slug: string) => `${lms}/pages/${encodeURIComponent(slug)}`,
  },
  cartRules: {
    bulkTiers: `${lms}/bulk-discount-tiers`,
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
    promoBanner: `${lms}/promo-banner`,
    membershipUpsell: `${lms}/membership-upsell`,
    checkoutFields: `${lms}/checkout-fields`,
  },
  footer: {
    get: `${lms}/footer`,
  },
  home: {
    get: `${lms}/home`,
    topbar: `${lms}/home/topbar`,
    hero: `${lms}/home/hero`,
    heroHeadline: `${lms}/home/hero-headline`,
    pricing: `${lms}/home/pricing`,
    trustedOrgs: `${lms}/home/trusted-orgs`,
    popularCoursesHeader: `${lms}/home/popular-courses-header`,
    why: `${lms}/home/why`,
    team: `${lms}/home/team`,
    certificate: `${lms}/home/certificate`,
    testimonials: `${lms}/home/testimonials`,
  },
  pricing: {
    get: `${lms}/pricing`,
    plans: `${lms}/pricing/plans`,
    faq: `${lms}/pricing/faq`,
  },
  memberships: {
    plans: `${lms}/memberships/plans`,
    subscribe: `${lms}/memberships/subscribe`,
    cancel: `${lms}/memberships/cancel`,
    myMembership: `${lms}/users/me/membership`,
  },
  student: {
    summary: `${lms}/student/summary`,
    courses: `${lms}/student/courses`,
    certificates: `${lms}/student/certificates`,
    certificatesShare: `${lms}/student/certificates/share`,
    subscription: `${lms}/student/subscription`,
    enroll: `${lms}/student/enroll`,
    orders: `${lms}/orders`,
  },
  admin: {
    colorSettings: `${lms}/admin/color-settings`,
    navigationSettings: `${lms}/admin/navigation-settings`,
    subscriptionPromos: `${lms}/admin/subscription-promo-settings`,
    allCategories: `${lms}/admin/all-categories`,
  },
  subscriptionPlans: `${lms}/subscription-plans`,
  /**
   * B2B business dashboard facade (`lms-b2b/v1`).
   *
   * Unlike the rest of this file these are **namespace-relative** paths, because
   * that is what `proxyToB2B()` takes — it prepends the namespace itself. The
   * `id` helpers encode their segments, so callers pass raw route params.
   */
  business: {
    // Utility
    status: "/status",

    // Business record
    current: "/businesses/current",
    /** `{owner_user_id}` — the owner's user id, not the `b2b_businesses` row id. */
    businessById: (ownerUserId: B2BId) => `/businesses${seg(ownerUserId)}`,
    /** `{business_id}` — the `b2b_businesses` row id, unlike `businessById`. */
    businessLogo: (businessId: B2BId) => `/businesses${seg(businessId)}/logo`,
    orders: "/businesses/orders",

    // Team
    team: "/team",
    teamMember: (id: B2BId) => `/team${seg(id)}`,
    teamCheckEmail: "/team/check-email",
    teamConvertRole: (id: B2BId) => `/team${seg(id)}/convert-role`,
    teamStats: "/team/stats",
    teamBulk: "/team/bulk",
    teamInvite: (id: B2BId) => `/team${seg(id)}/invite`,
    teamPasswordReset: (id: B2BId) => `/team${seg(id)}/password-reset`,

    // Courses and assignments
    courses: "/courses",
    assignments: "/courses/assignments",
    assignmentList: "/courses/assignment-list",
    assignCourse: "/courses/assign",
    courseLearners: (id: B2BId) => `/courses${seg(id)}/learners`,
    availableLearners: (id: B2BId) => `/courses${seg(id)}/available-learners`,
    learnerCourses: (id: B2BId) => `/courses/learner${seg(id)}`,
    learnerQuizScores: (courseId: B2BId, userId: B2BId) =>
      `/courses${seg(courseId)}/learner${seg(userId)}/quiz-scores`,
    courseCategories: "/course-categories",
    excludedCategories: "/course-categories/excluded",
    courseRemind: (id: B2BId) => `/courses${seg(id)}/remind`,
    remindBehind: "/courses/remind-behind",

    // Licences
    licenceCourses: "/licences/courses",
    licenceBalance: "/licences/balance",
    courseLicenceBalance: (courseId: B2BId) => `/licences/balance${seg(courseId)}`,
    licencePricing: "/licences/pricing",
    licencePricingCalculate: "/licences/pricing/calculate",
    licenceCheckout: "/licences/checkout",
    licenceSubscriptionCheckout: "/licences/subscription/checkout",
    licenceQuote: "/licences/quote",
    licenceAssign: "/licences/assign",
    licenceRevoke: "/licences/revoke",

    // Reports
    summary: "/reports/summary",
    reportCourses: "/reports/courses",
    reportMembers: "/reports/members",
    reportCertificates: "/reports/certificates",
    reportLearnerCourses: "/reports/learner-courses",
    reportMatrix: "/reports/matrix",
    reportCourseOptions: "/reports/courses/options",
    savedReports: "/reports/saved",
    savedReport: (id: B2BId) => `/reports/saved${seg(id)}`,

    // Certificates
    certificates: "/certificates",
    certificateGenerate: "/certificate/generate",

    // Subscriptions
    subscriptions: "/businesses/subscriptions",
    subscriptionActive: "/businesses/subscriptions/active",
    subscriptionSeatRoster: "/businesses/subscriptions/seat-roster",
    subscriptionSummary: "/businesses/subscriptions/summary",
    subscriptionAssigned: "/businesses/subscriptions/assigned",
    subscriptionAssignUser: "/businesses/subscriptions/assign-user",
    subscription: (id: B2BId) => `/businesses/subscriptions${seg(id)}`,
    subscriptionStatus: (id: B2BId) => `/businesses/subscriptions${seg(id)}/status`,
    subscriptionSeats: (id: B2BId) => `/businesses/subscriptions${seg(id)}/seats`,
    subscriptionSeat: (id: B2BId, seatId: B2BId) =>
      `/businesses/subscriptions${seg(id)}/seats${seg(seatId)}`,

    // Managers and permissions
    managers: "/managers",
    managersForBusiness: (id: B2BId) => `/managers/business${seg(id)}`,
    manager: (id: B2BId) => `/managers${seg(id)}`,
    managerStatus: (id: B2BId) => `/managers${seg(id)}/status`,
    managerCheckEmail: "/managers/check-email",
    managerCapabilities: "/permissions/manager/capabilities",
    managerPermissions: (id: B2BId) => `/permissions/business/managers${seg(id)}/permissions`,

    // Departments
    departments: "/departments",
    department: (id: B2BId) => `/departments${seg(id)}`,
    departmentMembers: (userId: B2BId) => `/departments/members${seg(userId)}`,

    // Settings
    settings: "/settings",
    settingsOnboarding: "/settings/onboarding",
    settingsReset: "/settings/reset",

    // Activity
    activity: "/activity",

    // Reviews
    reviews: "/reviews",
    reviewHas: "/reviews/has",
  },
  partners: {
    list: `${wp}/partner_logo`,
  },
  testimonials: {
    list: `${wp}/testimonial`,
  },
} as const;
