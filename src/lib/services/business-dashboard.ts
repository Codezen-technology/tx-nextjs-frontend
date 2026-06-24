import { bffJson } from "@/lib/api/bff-client";
import type {
  AssignmentsResponse,
  Business,
  BusinessListParams,
  CertificatesResponse,
  CoursesResponse,
  CreditBalance,
  LicenceBalanceResponse,
  LicenceCoursesResponse,
  TeamResponse,
  Learner,
  CourseLearnersResponse,
  B2BPaginated,
  BusinessSummary,
} from "@/types/business-dashboard";
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

  async getAssignments(params: BusinessListParams = {}): Promise<AssignmentsResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      status: params.status,
    });
    return bffJson<AssignmentsResponse>(`/api/business/courses/assignments${qs}`);
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
};
