import { bffJson } from "@/lib/api/bff-client";
import type {
  AllCategoriesResponse,
  CertificatesParams,
  CertificatesResponse,
  ColorSettings,
  NavigationSettings,
  StudentCoursesParams,
  StudentCoursesResponse,
  StudentCourse,
  StudentOrdersResponse,
  StudentOrder,
  StudentOrderDetail,
  Certificate,
  StudentSummary,
  SubscriptionPlan,
  SubscriptionPlanSettings,
  SubscriptionPromosResponse,
  SubscriptionResponse,
  WcProduct,
} from "@/types/student-dashboard";

/** Shape `paginated_success` always returns from the PHP backend. */
interface PaginatedEnvelope<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  totalPages: number;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const studentDashboardService = {
  async getSummary(): Promise<StudentSummary> {
    return bffJson<StudentSummary>("/api/student/summary");
  },

  async getCourses(params: StudentCoursesParams = {}): Promise<StudentCoursesResponse> {
    const qs = buildQuery({
      access: params.access,
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      orderby: params.orderby,
      category: params.category,
    });
    const raw = await bffJson<PaginatedEnvelope<StudentCourse>>(`/api/student/courses${qs}`);
    return {
      courses: raw.items ?? [],
      total: raw.total,
      page: raw.page,
      per_page: raw.per_page,
      totalPages: raw.totalPages,
    };
  },

  async getCertificates(params: CertificatesParams = {}): Promise<CertificatesResponse> {
    const qs = buildQuery({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      only_with_certificate: params.only_with_certificate,
    });
    const raw = await bffJson<PaginatedEnvelope<Certificate>>(`/api/student/certificates${qs}`);
    return {
      certificates: raw.items ?? [],
      total: raw.total,
      page: raw.page,
      per_page: raw.per_page,
      totalPages: raw.totalPages,
    };
  },

  async shareCertificate(courseId: number, email: string): Promise<{ sent: boolean }> {
    return bffJson<{ sent: boolean }>("/api/student/certificates/share", {
      method: "POST",
      body: JSON.stringify({ course_id: courseId, recipient_email: email }),
    });
  },

  async getSubscription(): Promise<SubscriptionResponse> {
    return bffJson<SubscriptionResponse>("/api/student/subscription");
  },

  async enrollCourse(courseId: number): Promise<{ message?: string }> {
    return bffJson<{ message?: string }>("/api/student/enroll", {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
    });
  },

  async getOrders(page = 1, perPage = 20): Promise<StudentOrdersResponse> {
    const qs = buildQuery({ page, per_page: perPage });
    const raw = await bffJson<PaginatedEnvelope<StudentOrder>>(`/api/student/orders${qs}`);
    return {
      orders: raw.items ?? [],
      total: raw.total,
      page: raw.page,
      per_page: raw.per_page,
      totalPages: raw.totalPages,
    };
  },

  async getOrder(id: number): Promise<StudentOrderDetail> {
    return bffJson<StudentOrderDetail>(`/api/student/orders/${id}`);
  },

  async getColorSettings(): Promise<ColorSettings> {
    return bffJson<ColorSettings>("/api/admin/color-settings");
  },

  async getNavigationSettings(): Promise<NavigationSettings> {
    return bffJson<NavigationSettings>("/api/admin/navigation-settings");
  },

  async getPromos(): Promise<SubscriptionPromosResponse> {
    return bffJson<SubscriptionPromosResponse>("/api/admin/subscription-promo-settings");
  },

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return bffJson<SubscriptionPlan[]>("/api/subscription-plans");
  },

  async getAllCategories(): Promise<AllCategoriesResponse> {
    return bffJson<AllCategoriesResponse>("/api/admin/all-categories");
  },

  async getSubscriptionPlanSettings(): Promise<SubscriptionPlanSettings> {
    return bffJson<SubscriptionPlanSettings>("/api/admin/subscription-plan-settings");
  },

  async updateSubscriptionPlanSettings(
    payload: Partial<SubscriptionPlanSettings>,
  ): Promise<SubscriptionPlanSettings> {
    return bffJson<SubscriptionPlanSettings>("/api/admin/subscription-plan-settings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getAdminProducts(): Promise<WcProduct[]> {
    return bffJson<WcProduct[]>("/api/admin/products");
  },
};
