import { bffJson } from "@/lib/api/bff-client";
import { ApiError } from "@/lib/api/error";
import type {
  AddLearnerPayload,
  AccountActionResult,
  ActivityResponse,
  AssignCoursePayload,
  AssignmentListResponse,
  AssignmentsResponse,
  AssignedSubscription,
  AvailableLearnersResponse,
  B2BPluginStatus,
  BulkImportMember,
  BulkImportResult,
  Business,
  BusinessListParams,
  BusinessCertificateWire,
  BusinessCourseCategory,
  BusinessLogo,
  BusinessManager,
  BusinessOrdersResponse,
  BusinessSettings,
  BusinessSettingsUpdate,
  BusinessSummary,
  CertificatesResponse,
  CheckEmailResponse,
  CourseLearnersResponse,
  Department,
  DepartmentsResponse,
  CoursesResponse,
  Learner,
  LearnerCoursesReport,
  LearnerSubscriptionCheckResponse,
  LearnerCoursesResponse,
  LearnerQuizScoresResponse,
  LicenceBalanceResponse,
  LicenceCoursesResponse,
  MatrixCourse,
  MemberDepartmentsResponse,
  ManagersResponse,
  ManagerEmailCheck,
  ManagerCapabilitiesResponse,
  ManagerPermissions,
  OnboardingPayload,
  RemindResult,
  ReviewHasResponse,
  SavedReportView,
  SeatRosterResponse,
  SubmitReviewPayload,
  SubscriptionSummary,
  SubscriptionSeatsResponse,
  TeamResponse,
  TeamStats,
  TrainingMatrix,
  B2BPaginated,
  ReportCertificate,
  ReportCourse,
  ReportMember,
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

function buildQuery(
  params: Record<string, string | number | boolean | number[] | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    // Arrays go out as repeated `key[]=` pairs, which is what WP's REST arg
    // parser reads back into a PHP array.
    if (Array.isArray(v)) {
      for (const item of v) sp.append(`${k}[]`, String(item));
      continue;
    }
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const businessDashboardService = {
  /** Public probe — GET lms-b2b/v1/status (no auth). Returns null when plugin inactive. */
  async getPluginStatus(): Promise<B2BPluginStatus | null> {
    try {
      return await bffJson<B2BPluginStatus>("/api/business/status");
    } catch {
      return null;
    }
  },

  async getSummary(): Promise<BusinessSummary> {
    return bffJson<BusinessSummary>("/api/business/summary");
  },

  async getProfile(): Promise<Business> {
    return bffJson<Business>("/api/business/profile");
  },

  /**
   * `PATCH /businesses/{owner_user_id}` — the segment is the **owner's user id**,
   * not the `b2b_businesses` row id returned as `Business.id`. The backend named
   * the variable honestly in Tier A; passing `.id` here silently targeted the
   * wrong business.
   */
  async updateProfile(ownerUserId: number, data: Partial<Business>): Promise<Business> {
    return bffJson<Business>(`/api/business/profile/${ownerUserId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * Upload a business logo. `businessId` is the `b2b_businesses` row id
   * (`Business.id`) — not the owner user id `updateProfile` takes.
   *
   * Sent as multipart under the field name `file`, which is what
   * `media_handle_upload()` reads on the backend.
   */
  async uploadLogo(businessId: number, file: File): Promise<BusinessLogo> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/business/profile/${businessId}/logo`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      throw new ApiError({
        status: res.status,
        code: payload?.code ?? "logo_upload_failed",
        message: payload?.error ?? payload?.message ?? "Could not upload the logo",
        raw: payload,
      });
    }

    return payload as BusinessLogo;
  },

  async deleteLogo(businessId: number): Promise<{ deleted: boolean }> {
    return bffJson<{ deleted: boolean }>(`/api/business/profile/${businessId}/logo`, {
      method: "DELETE",
    });
  },

  async getLearners(params: BusinessListParams = {}): Promise<TeamResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
      role: params.role,
      department_id: params.department_id,
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

  /**
   * The course catalogue.
   *
   * `orderby` is deliberately omitted when unset: the backend treats an absent
   * value as `menu_order DESC, date DESC`, and sending a default would re-sort
   * every caller that never asked for one.
   */
  async getCourses(params: BusinessListParams = {}): Promise<CoursesResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
      orderby: params.orderby,
      taxonomy: params.taxonomy?.length ? params.taxonomy : undefined,
    });
    return bffJson<CoursesResponse>(`/api/business/courses${qs}`);
  },

  /** Course categories with exclusions already applied server-side. */
  async getCourseCategories(): Promise<BusinessCourseCategory[]> {
    const data = await bffJson<{ categories?: BusinessCourseCategory[] }>(
      "/api/business/course-categories",
    );
    return data.categories ?? [];
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

  /**
   * Return a spent licence to its pool.
   *
   * `POST /courses/assign` consumes a licence implicitly; this is the only way
   * back. `assignmentId` is `CourseAssignment.id`, not the learner or course id.
   */
  async revokeLicence(assignmentId: number): Promise<{ revoked: boolean; message?: string }> {
    return bffJson<{ revoked: boolean; message?: string }>("/api/business/licences/revoke", {
      method: "POST",
      body: JSON.stringify({ assignment_id: assignmentId }),
    });
  },

  /** Direct pool assignment, as opposed to `POST /courses/assign`. */
  async assignLicence(payload: { course_id: number; user_ids: number[] }): Promise<unknown> {
    return bffJson<unknown>("/api/business/licences/assign", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getLearnerQuizScores(courseId: number, userId: number): Promise<LearnerQuizScoresResponse> {
    return bffJson<LearnerQuizScoresResponse>(
      `/api/business/courses/${courseId}/learner/${userId}/quiz-scores`,
    );
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

  /**
   * The aggregated active subscription, or null when there is none.
   *
   * Server-side since Tier A. This used to sum a `?per_page=50` page of rows
   * client-side, which was silently wrong for any tenant with more than fifty
   * subscriptions.
   */
  async getActiveSubscription(): Promise<AggregatedActiveSubscription | null> {
    try {
      const data = await bffJson<AggregatedActiveSubscription | null>(
        "/api/business/subscriptions/active",
      );
      return data ?? null;
    } catch {
      return null;
    }
  },

  // ─── Departments (Tier C) ────────────────────────────────────────────────────

  async getDepartments(): Promise<DepartmentsResponse> {
    return bffJson<DepartmentsResponse>("/api/business/departments");
  },

  async createDepartment(payload: { name: string; parent_id?: number }): Promise<Department> {
    return bffJson<Department>("/api/business/departments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateDepartment(
    id: number,
    payload: { name?: string; parent_id?: number },
  ): Promise<Department> {
    return bffJson<Department>(`/api/business/departments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  /** Members are detached and children reparented — the people are not deleted. */
  async deleteDepartment(id: number): Promise<{ deleted: boolean }> {
    return bffJson<{ deleted: boolean }>(`/api/business/departments/${id}`, { method: "DELETE" });
  },

  async getMemberDepartments(userId: number): Promise<Department[]> {
    const data = await bffJson<MemberDepartmentsResponse>(
      `/api/business/departments/members/${userId}`,
    );
    return data.departments ?? [];
  },

  /** Replaces the whole set — an empty array clears every membership. */
  async setMemberDepartments(userId: number, departmentIds: number[]): Promise<Department[]> {
    const data = await bffJson<MemberDepartmentsResponse>(
      `/api/business/departments/members/${userId}`,
      { method: "PUT", body: JSON.stringify({ department_ids: departmentIds }) },
    );
    return data.departments ?? [];
  },

  // ─── Saved report views (Tier C) ─────────────────────────────────────────────

  async getSavedReports(reportType = "learner-courses"): Promise<SavedReportView[]> {
    const qs = buildQuery({ report_type: reportType });
    const data = await bffJson<{ saved_reports?: SavedReportView[] }>(
      `/api/business/reports/saved${qs}`,
    );
    return data.saved_reports ?? [];
  },

  async createSavedReport(payload: {
    name: string;
    filters: Record<string, string | number | undefined>;
    report_type?: string;
  }): Promise<SavedReportView> {
    return bffJson<SavedReportView>("/api/business/reports/saved", {
      method: "POST",
      body: JSON.stringify({ report_type: "learner-courses", ...payload }),
    });
  },

  async updateSavedReport(
    id: number,
    payload: { name?: string; filters?: Record<string, string | number | undefined> },
  ): Promise<SavedReportView> {
    return bffJson<SavedReportView>(`/api/business/reports/saved/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async deleteSavedReport(id: number): Promise<{ deleted: boolean }> {
    return bffJson<{ deleted: boolean }>(`/api/business/reports/saved/${id}`, {
      method: "DELETE",
    });
  },

  // ─── Bulk import (Tier C) ────────────────────────────────────────────────────

  /**
   * Import up to 500 learners in one request.
   *
   * Replaces the per-row loop the CSV importer used. A row whose learner was
   * created but whose course assignment failed comes back `added` with a
   * `no_licence_available` code — the learner does exist, and reporting it as
   * skipped would send a manager looking for someone already on the team.
   */
  async bulkImportLearners(members: BulkImportMember[]): Promise<BulkImportResult> {
    return bffJson<BulkImportResult>("/api/business/team/bulk", {
      method: "POST",
      body: JSON.stringify({ members }),
    });
  },

  // ─── Settings (Tier B) ───────────────────────────────────────────────────────

  async getSettings(): Promise<BusinessSettings> {
    return bffJson<BusinessSettings>("/api/business/settings");
  },

  async updateSettings(payload: BusinessSettingsUpdate): Promise<BusinessSettings> {
    return bffJson<BusinessSettings>("/api/business/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  /**
   * The onboarding wizard's final step. Nothing the wizard collects is persisted
   * until this call, so abandoning it leaves the tenant untouched.
   */
  async completeOnboarding(payload: OnboardingPayload): Promise<BusinessSettings> {
    return bffJson<BusinessSettings>("/api/business/settings/onboarding", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** Restores defaults and reopens the wizard. Learners and assignments are untouched. */
  async resetSettings(): Promise<BusinessSettings> {
    return bffJson<BusinessSettings>("/api/business/settings/reset", { method: "POST" });
  },

  // ─── Activity + learner reports (Tier B) ─────────────────────────────────────

  async getActivity(params: BusinessListParams = {}): Promise<ActivityResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      course_id: params.course_id,
      learner_id: params.learner_id,
      department_id: params.department_id,
    });
    return bffJson<ActivityResponse>(`/api/business/activity${qs}`);
  },

  /**
   * Flat learner x course rows behind the status reports.
   *
   * `pass_mark` is deliberately omitted when unset: the backend reads an absent
   * value as "use the business's configured mark" and echoes the effective one
   * back, so sending a default would override the tenant's setting.
   */
  async getLearnerCoursesReport(params: BusinessListParams = {}): Promise<LearnerCoursesReport> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
      course_id: params.course_id,
      learner_id: params.learner_id,
      department_id: params.department_id,
      pass_mark: params.pass_mark,
    });
    return bffJson<LearnerCoursesReport>(`/api/business/reports/learner-courses${qs}`);
  },

  async getTrainingMatrix(params: BusinessListParams = {}): Promise<TrainingMatrix> {
    const qs = buildQuery({
      course_id: params.course_id,
      learner_id: params.learner_id,
      department_id: params.department_id,
      pass_mark: params.pass_mark,
    });
    return bffJson<TrainingMatrix>(`/api/business/reports/matrix${qs}`);
  },

  /** Course id + title only — the cheap option list, not the whole matrix. */
  async getReportCourseOptions(): Promise<MatrixCourse[]> {
    const data = await bffJson<{ courses?: MatrixCourse[] }>(
      "/api/business/reports/courses/options",
    );
    return data.courses ?? [];
  },

  async getTeamStats(): Promise<TeamStats> {
    return bffJson<TeamStats>("/api/business/team/stats");
  },

  // ─── Learner account actions (Tier B) ────────────────────────────────────────

  async inviteLearner(id: number): Promise<AccountActionResult> {
    return bffJson<AccountActionResult>(`/api/business/team/${id}/invite`, { method: "POST" });
  },

  async sendPasswordReset(id: number): Promise<AccountActionResult> {
    return bffJson<AccountActionResult>(`/api/business/team/${id}/password-reset`, {
      method: "POST",
    });
  },

  // ─── Reminders (Tier B) ──────────────────────────────────────────────────────

  async remindCourse(courseId: number): Promise<RemindResult> {
    return bffJson<RemindResult>(`/api/business/courses/${courseId}/remind`, { method: "POST" });
  },

  /**
   * Server-side sweep across the active filters. `learners` is the population
   * selected, so `learners: 0` means nobody was behind — distinct from every
   * mail having failed.
   */
  async remindBehind(
    filters: { course_id?: number; learner_id?: number } = {},
  ): Promise<RemindResult> {
    return bffJson<RemindResult>("/api/business/courses/remind-behind", {
      method: "POST",
      body: JSON.stringify(filters),
    });
  },

  /**
   * Which of these learners already hold a subscription seat.
   *
   * Capped at 100 ids by the backend. `business_id` is the owner user id, the
   * same value `Business.user_id` carries.
   */
  async checkLearnersSubscriptions(
    learnerIds: number[],
    businessId: number,
  ): Promise<LearnerSubscriptionCheckResponse> {
    return bffJson<LearnerSubscriptionCheckResponse>("/api/business/subscriptions/check-learners", {
      method: "POST",
      body: JSON.stringify({ learner_ids: learnerIds, business_id: businessId }),
    });
  },

  async getSeatRoster(params: BusinessListParams = {}): Promise<SeatRosterResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
    });
    return bffJson<SeatRosterResponse>(`/api/business/subscriptions/seat-roster${qs}`);
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
      course_id: params.course_id,
      learner_id: params.learner_id,
      department_id: params.department_id,
    });
    return bffJson<B2BPaginated<ReportCertificate>>(`/api/business/reports/certificates${qs}`);
  },

  /**
   * The certificate register. The facade nests course and user, so rows are
   * flattened here — components should never reach into `row.course.name`.
   */
  async getCertificates(params: BusinessListParams = {}): Promise<CertificatesResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
      orderby: params.orderby,
      order: params.order,
      course_id: params.course_id,
      learner_id: params.learner_id,
      date_from: params.date_from,
      date_to: params.date_to,
      department_id: params.department_id,
    });
    const raw = await bffJson<{
      items?: BusinessCertificateWire[];
      total?: number;
      pages?: number;
      page?: number;
      per_page?: number;
    }>(`/api/business/certificates${qs}`);

    return {
      items: (raw.items ?? []).map((row) => ({
        id: row.id,
        course_id: row.course?.id ?? 0,
        course_name: row.course?.name ?? "",
        user_id: row.user?.id ?? 0,
        learner_name: row.user?.name ?? "",
        learner_email: row.user?.email ?? "",
        certificate_url: row.certificate_url ?? null,
        issued_date: row.issued_date ?? null,
        expiry_date: row.expiry_date ?? null,
        status: row.status ?? "active",
      })),
      total: raw.total ?? 0,
      pages: raw.pages,
      page: raw.page,
      per_page: raw.per_page,
    };
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

  async getSubscriptionSummary(): Promise<SubscriptionSummary> {
    return bffJson<SubscriptionSummary>("/api/business/subscriptions/summary");
  },

  async getSubscription(id: number): Promise<AssignedSubscription> {
    return bffJson<AssignedSubscription>(`/api/business/subscriptions/${id}`);
  },

  async getSubscriptionSeats(id: number): Promise<SubscriptionSeatsResponse> {
    return bffJson<SubscriptionSeatsResponse>(`/api/business/subscriptions/${id}/seats`);
  },

  async setSubscriptionStatus(
    id: number,
    status: "active" | "on-hold",
  ): Promise<AssignedSubscription> {
    return bffJson<AssignedSubscription>(`/api/business/subscriptions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async revokeSubscriptionSeat(id: number, seatId: number): Promise<{ revoked: boolean }> {
    return bffJson<{ revoked: boolean }>(`/api/business/subscriptions/${id}/seats/${seatId}`, {
      method: "DELETE",
    });
  },

  async assignUserToSubscription(payload: {
    user_id: number;
    subscription_type: string;
  }): Promise<{ subscription_id: number }> {
    return bffJson<{ subscription_id: number }>("/api/business/subscriptions/assign-user", {
      method: "POST",
      body: JSON.stringify(payload),
    });
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

  async addManager(payload: {
    business_id: number;
    email: string;
    first_name: string;
    last_name: string;
  }): Promise<BusinessManager> {
    return bffJson<BusinessManager>("/api/business/managers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateManager(
    id: number,
    payload: { business_id: number; status?: string },
  ): Promise<BusinessManager> {
    return bffJson<BusinessManager>(`/api/business/managers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async setManagerStatus(id: number, status: string): Promise<BusinessManager> {
    return bffJson<BusinessManager>(`/api/business/managers/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  async deleteManager(id: number): Promise<{ deleted: boolean }> {
    return bffJson<{ deleted: boolean }>(`/api/business/managers/${id}`, {
      method: "DELETE",
    });
  },

  async checkManagerEmail(email: string, businessId: number): Promise<ManagerEmailCheck> {
    const qs = buildQuery({ email, business_id: businessId });
    return bffJson<ManagerEmailCheck>(`/api/business/managers/check-email${qs}`);
  },

  async getManagerCapabilities(managerId: number): Promise<ManagerCapabilitiesResponse> {
    const qs = buildQuery({ manager_id: managerId });
    return bffJson<ManagerCapabilitiesResponse>(
      `/api/business/permissions/manager/capabilities${qs}`,
    );
  },

  async updateManagerPermissions(
    managerId: number,
    permissions: ManagerPermissions,
  ): Promise<{ updated: boolean; permissions: ManagerPermissions }> {
    return bffJson(`/api/business/permissions/business/managers/${managerId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
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
