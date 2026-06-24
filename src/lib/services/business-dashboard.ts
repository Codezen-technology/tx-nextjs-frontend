import { bffJson } from "@/lib/api/bff-client";
import type {
  AddLearnerPayload,
  AssignCoursePayload,
  AssignmentListResponse,
  AssignmentsResponse,
  AssignedSubscription,
  AvailableLearnersResponse,
  Business,
  BusinessListParams,
  BusinessManager,
  BusinessOrdersResponse,
  BusinessSummary,
  BusinessSystemType,
  CertificatesResponse,
  CheckEmailResponse,
  CourseLearnersResponse,
  CoursesResponse,
  CreditBalance,
  CreditDiscountTier,
  CreditProduct,
  CreditTransactionsResponse,
  Learner,
  LearnerCoursesResponse,
  LicenceBalanceResponse,
  LicenceCoursesResponse,
  ManagersResponse,
  ReviewHasResponse,
  SubmitReviewPayload,
  SubscriptionSummary,
  TeamResponse,
  B2BPaginated,
} from "@/types/business-dashboard";
import type {
  AggregatedActiveSubscription,
  BusinessSubscriptionItem,
  LicenceCheckoutResult,
  LicenceCourseItem,
  LicenceOrderSummary,
  LicencePricingConfig,
  QuoteRequestPayload,
} from "@/types/business-pricing";
import type { ReportCertificate, ReportCourse, ReportMember } from "@/types/business-dashboard";

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const businessDashboardService = {
  async getSummary(): Promise<BusinessSummary> {
    return bffJson<BusinessSummary>("/api/business/summary");
  },

  async getProfile(): Promise<Business> {
    return bffJson<Business>("/api/business/profile");
  },

  async updateProfile(id: number, data: Partial<Business>): Promise<Business> {
    return bffJson<Business>(`/api/business/profile/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async getCreditBalance(): Promise<CreditBalance> {
    return bffJson<CreditBalance>("/api/business/credit-balance");
  },

  async getLearners(params: BusinessListParams = {}): Promise<TeamResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
    });
    return bffJson<TeamResponse>(`/api/business/team${qs}`);
  },

  async getLearner(id: number): Promise<Learner> {
    return bffJson<Learner>(`/api/business/team/${id}`);
  },

  async checkLearnerEmail(email: string): Promise<CheckEmailResponse> {
    return bffJson<CheckEmailResponse>(
      `/api/business/team/check-email?email=${encodeURIComponent(email)}`,
    );
  },

  async addLearner(payload: AddLearnerPayload): Promise<Learner> {
    return bffJson<Learner>("/api/business/team", {
      method: "POST",
      body: JSON.stringify({ ...payload, role: payload.role ?? "learner" }),
    });
  },

  async updateLearner(id: number, payload: { status?: string }): Promise<Learner> {
    return bffJson<Learner>(`/api/business/team/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async convertLearnerRole(id: number, role: string): Promise<unknown> {
    return bffJson(`/api/business/team/${id}/convert-role`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  },

  async getAssignments(params: BusinessListParams = {}): Promise<AssignmentsResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
    });
    return bffJson<AssignmentsResponse>(`/api/business/courses/assignments${qs}`);
  },

  async getAssignmentList(params: BusinessListParams = {}): Promise<AssignmentListResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
    });
    return bffJson<AssignmentListResponse>(`/api/business/courses/assignment-list${qs}`);
  },

  async getCourses(params: BusinessListParams = {}): Promise<CoursesResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
    });
    return bffJson<CoursesResponse>(`/api/business/courses${qs}`);
  },

  async getLearnerCourses(
    learnerId: number,
    params: BusinessListParams = {},
  ): Promise<LearnerCoursesResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
    });
    return bffJson<LearnerCoursesResponse>(`/api/business/courses/learner/${learnerId}${qs}`);
  },

  async getCourseLearners(
    courseId: number,
    params: BusinessListParams = {},
  ): Promise<CourseLearnersResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
    });
    return bffJson<CourseLearnersResponse>(`/api/business/courses/${courseId}/learners${qs}`);
  },

  async getAvailableLearners(
    courseId: number,
    params: BusinessListParams = {},
  ): Promise<AvailableLearnersResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
    });
    return bffJson<AvailableLearnersResponse>(
      `/api/business/courses/${courseId}/available-learners${qs}`,
    );
  },

  async assignCourse(payload: AssignCoursePayload): Promise<unknown> {
    return bffJson("/api/business/courses/assign", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getLicenceCourses(params: BusinessListParams = {}): Promise<LicenceCoursesResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
    });
    return bffJson<LicenceCoursesResponse>(`/api/business/licences/courses${qs}`);
  },

  async getLicenceBalance(): Promise<LicenceBalanceResponse> {
    return bffJson<LicenceBalanceResponse>("/api/business/licences/balance");
  },

  async getCourseLicenceBalance(courseId: number): Promise<LicenceBalanceResponse> {
    return bffJson<LicenceBalanceResponse>(`/api/business/licences/balance/${courseId}`);
  },

  async getLicencePricing(): Promise<LicencePricingConfig> {
    const data = await bffJson<{
      tiers?: Array<{
        min_qty?: number;
        min_quantity?: number;
        discount_percent: number;
        id?: number;
      }>;
      vat_enabled?: boolean;
      vat_rate?: number;
      vat_label?: string;
      default_price?: number;
      subscription_price?: number;
    }>("/api/business/licences/pricing");
    const tiers = (data.tiers ?? []).map((t) => ({
      id: t.id,
      min_qty: t.min_qty ?? t.min_quantity ?? 0,
      discount_percent: Number(t.discount_percent),
    }));
    const vatRate = Number(data.vat_rate ?? 0);
    return {
      tiers,
      vat_enabled: data.vat_enabled ?? vatRate > 0,
      vat_rate: vatRate,
      vat_label: data.vat_label ?? (vatRate > 0 ? `VAT (${Math.round(vatRate * 100)}%)` : ""),
      default_price: Number(data.default_price ?? 0),
      subscription_price: Number(data.subscription_price ?? 0),
    };
  },

  async searchLicenceCourses(params: BusinessListParams = {}): Promise<{
    courses: LicenceCourseItem[];
    total: number;
    pages?: number;
  }> {
    const qs = buildQuery({
      search: params.search,
      page: params.page,
      per_page: params.per_page,
    });
    const data = await bffJson<LicenceCoursesResponse & { courses?: LicenceCourseItem[] }>(
      `/api/business/licences/courses${qs}`,
    );
    return {
      courses: (data.courses ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        featured_image: c.featured_image,
        price_per_licence: Number(c.price_per_licence),
      })),
      total: data.total ?? 0,
      pages: data.pages,
    };
  },

  async calculateLicenceOrder(
    items: Array<{ course_id: number; qty: number }>,
  ): Promise<LicenceOrderSummary> {
    const data = await bffJson<{ summary: LicenceOrderSummary }>(
      "/api/business/licences/pricing/calculate",
      { method: "POST", body: JSON.stringify({ items }) },
    );
    return data.summary;
  },

  async checkoutLicences(
    items: Array<{ course_id: number; qty: number }>,
  ): Promise<LicenceCheckoutResult> {
    return bffJson<LicenceCheckoutResult>("/api/business/licences/checkout", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },

  async checkoutSubscriptionLicences(qty: number): Promise<LicenceCheckoutResult> {
    return bffJson<LicenceCheckoutResult>("/api/business/licences/subscription/checkout", {
      method: "POST",
      body: JSON.stringify({ qty }),
    });
  },

  async requestLicenceQuote(payload: QuoteRequestPayload): Promise<{ message?: string }> {
    return bffJson("/api/business/licences/quote", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getBusinessSubscriptions(
    params: BusinessListParams = {},
  ): Promise<B2BPaginated<BusinessSubscriptionItem>> {
    const qs = buildQuery({ page: params.page, per_page: params.per_page });
    return bffJson<B2BPaginated<BusinessSubscriptionItem>>(`/api/business/subscriptions${qs}`);
  },

  async getActiveSubscription(): Promise<AggregatedActiveSubscription | null> {
    try {
      const res = await this.getBusinessSubscriptions({ per_page: 50 });
      const items = res.items ?? [];
      const yearly = items.filter((s) => s.status === "active" && s.plan_type !== "lifetime");
      if (!yearly.length) return null;
      return yearly.reduce(
        (acc, s) => ({
          total_seats: acc.total_seats + (s.total_seats ?? 0),
          assigned_seats: acc.assigned_seats + (s.assigned_seats ?? 0),
          available_seats: acc.available_seats + (s.available_seats ?? 0),
          end_date:
            !acc.end_date || (s.end_date && s.end_date > acc.end_date) ? s.end_date : acc.end_date,
        }),
        {
          total_seats: 0,
          assigned_seats: 0,
          available_seats: 0,
          end_date: undefined as string | undefined,
        },
      );
    } catch {
      return null;
    }
  },

  async getReportCourses(params: BusinessListParams = {}): Promise<B2BPaginated<ReportCourse>> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
    });
    return bffJson<B2BPaginated<ReportCourse>>(`/api/business/reports/courses${qs}`);
  },

  async getReportMembers(params: BusinessListParams = {}): Promise<B2BPaginated<ReportMember>> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
    });
    return bffJson<B2BPaginated<ReportMember>>(`/api/business/reports/members${qs}`);
  },

  async getReportCertificates(
    params: BusinessListParams = {},
  ): Promise<B2BPaginated<ReportCertificate>> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
    });
    return bffJson<B2BPaginated<ReportCertificate>>(`/api/business/reports/certificates${qs}`);
  },

  async getCertificates(params: BusinessListParams = {}): Promise<CertificatesResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
    });
    return bffJson<CertificatesResponse>(`/api/business/certificates${qs}`);
  },

  async generateCertificate(payload: {
    user_id: number;
    course_id: number;
  }): Promise<{ certificate_url?: string }> {
    return bffJson("/api/business/certificate/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getOrders(params: BusinessListParams = {}): Promise<BusinessOrdersResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      status: params.status,
    });
    return bffJson<BusinessOrdersResponse>(`/api/business/orders${qs}`);
  },

  async getSystemType(): Promise<BusinessSystemType> {
    return bffJson<BusinessSystemType>("/api/business/system-type");
  },

  async switchSystem(systemType: "credits" | "subscription"): Promise<unknown> {
    return bffJson("/api/business/system-type/switch", {
      method: "POST",
      body: JSON.stringify({ system_type: systemType }),
    });
  },

  async getCreditTransactions(page = 1, perPage = 10): Promise<CreditTransactionsResponse> {
    return bffJson<CreditTransactionsResponse>(
      `/api/business/credits/transactions?page=${page}&per_page=${perPage}`,
    );
  },

  async getCreditDiscountTiers(): Promise<CreditDiscountTier[]> {
    const data = await bffJson<CreditDiscountTier[] | { tiers?: CreditDiscountTier[] }>(
      "/api/business/credits/discount-tiers",
    );
    return Array.isArray(data) ? data : (data.tiers ?? []);
  },

  async getCreditProduct(): Promise<CreditProduct> {
    return bffJson<CreditProduct>("/api/business/credits/product");
  },

  async purchaseCredits(quantity: number): Promise<{ checkout_url?: string }> {
    return bffJson("/api/business/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ quantity }),
    });
  },

  async getSubscriptionSummary(): Promise<SubscriptionSummary> {
    return bffJson<SubscriptionSummary>("/api/business/subscriptions/summary");
  },

  async getAssignedSubscriptions(
    params: BusinessListParams = {},
  ): Promise<B2BPaginated<AssignedSubscription>> {
    const qs = buildQuery({ page: params.page, per_page: params.per_page });
    return bffJson<B2BPaginated<AssignedSubscription>>(`/api/business/subscriptions/assigned${qs}`);
  },

  async getExcludedCategories(): Promise<number[]> {
    const data = await bffJson<number[] | { excluded?: number[]; categories?: number[] }>(
      "/api/business/course-categories/excluded",
    );
    if (Array.isArray(data)) return data;
    return data.excluded ?? data.categories ?? [];
  },

  async getManagers(businessId: number): Promise<ManagersResponse> {
    return bffJson<ManagersResponse>(`/api/business/managers?business_id=${businessId}`);
  },

  async addManager(payload: { email: string; display_name?: string }): Promise<BusinessManager> {
    return bffJson<BusinessManager>("/api/business/managers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async hasReview(): Promise<ReviewHasResponse> {
    return bffJson<ReviewHasResponse>("/api/business/reviews/has");
  },

  async submitReview(payload: SubmitReviewPayload): Promise<unknown> {
    return bffJson("/api/business/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
