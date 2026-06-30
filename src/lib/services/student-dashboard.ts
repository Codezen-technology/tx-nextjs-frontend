import { bffJson } from "@/lib/api/bff-client";
import { toFrontendPath, toFrontendUrl } from "@/lib/utils/url";
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
  UnlockCertificateResponse,
  GenerateCertificateResponse,
  CertificateOrderConfig,
  CertificateOrderPayload,
  CertificateOrderResponse,
  MiscellaneousSettings,
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
      // Rewrite the course content link to the frontend. Use an ABSOLUTE frontend
      // URL — course_permalink also feeds social share links, which need a full URL.
      // The certificate/transcript PDF download URLs are functional backend
      // endpoints and stay untouched.
      certificates: (raw.items ?? []).map((c) => ({
        ...c,
        course_permalink: toFrontendUrl(c.course_permalink),
      })),
      total: raw.total,
      page: raw.page,
      per_page: raw.per_page,
      totalPages: raw.totalPages,
    };
  },

  async shareCertificate(
    courseId: number,
    email: string,
    message?: string,
  ): Promise<{ sent: boolean }> {
    return bffJson<{ sent: boolean }>("/api/student/certificates/share", {
      method: "POST",
      body: JSON.stringify({
        course_id: courseId,
        recipient_email: email,
        ...(message ? { message } : {}),
      }),
    });
  },

  async unlockCertificate(courseId: number): Promise<UnlockCertificateResponse> {
    return bffJson<UnlockCertificateResponse>("/api/student/certificates/unlock", {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
    });
  },

  async generateCertificate(courseId: number): Promise<GenerateCertificateResponse> {
    return bffJson<GenerateCertificateResponse>("/api/student/certificates/generate", {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
    });
  },

  async getCertificateOrderConfig(): Promise<CertificateOrderConfig> {
    return bffJson<CertificateOrderConfig>("/api/student/certificate-orders/config");
  },

  async submitCertificateOrder(
    payload: CertificateOrderPayload,
  ): Promise<CertificateOrderResponse> {
    return bffJson<CertificateOrderResponse>("/api/student/certificate-orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getMiscellaneousSettings(): Promise<MiscellaneousSettings> {
    const raw = await bffJson<MiscellaneousSettings>("/api/admin/miscellaneous-settings");
    return {
      ...raw,
      certificate_order_link: raw.certificate_order_link
        ? toFrontendPath(raw.certificate_order_link)
        : "/dashboard/certificate",
    };
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
    const raw = await bffJson<SubscriptionPromosResponse>("/api/admin/subscription-promo-settings");
    return {
      ...raw,
      promos: (raw.promos ?? []).map((p) => ({ ...p, button_url: toFrontendPath(p.button_url) })),
    };
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
