// Student dashboard types — aligned with lms-backend/v1 student endpoints

export interface StudentSummaryHeader {
  title: string;
  subtitle: string;
  user_display_name: string;
  user_avatar_url: string;
}

export interface StudentSummaryCounters {
  active: number;
  completed: number;
  certificates: number;
}

export interface StudentSummary {
  header: StudentSummaryHeader;
  counters: StudentSummaryCounters;
  certificate_credits_available?: number;
  has_active_subscription?: boolean;
}

export interface StudentCourse {
  id: number;
  name: string;
  excerpt: string;
  featured_image: string;
  courseCat: number[];
  course_cat_names?: string[];
  link: string;
  product_id?: string;
  price?: number | null;
  regular_price?: number | null;
  currency?: string;
  on_sale?: boolean;
  is_free?: boolean;
  units?: number;
  course_duration?: number;
  is_enrolled?: boolean;
  user_progress: number;
  /** 1=active · 2=complete · 3=passed · 4=failed · 5=expired */
  user_status: number;
  duration: number;
  user_expiry: string;
  start_date: number;
  display_start_date: string;
  instructor?: (string | number)[];
  menu_order?: number;
  is_certificate_unlocked?: string;
  is_certificate_generated?: boolean;
  certificate_url?: string;
}

export interface StudentCoursesResponse {
  courses: StudentCourse[];
  total: number;
  page: number;
  per_page: number;
  totalPages: number;
}

export interface StudentCoursesParams {
  access?: "active" | "completed" | "all";
  page?: number;
  per_page?: number;
  search?: string;
  orderby?: "recently_accessed" | "title" | "date";
  category?: number;
}

export interface Certificate {
  course_id: number;
  title: string;
  slug: string;
  course_permalink: string;
  featured_image: string | false;
  progress: number;
  lms_certificate_url: string | false;
  is_certificate_unlocked: string;
  has_course_certificate: boolean;
  is_transcript_unlocked: string;
  transcript_url: string;
  certificate_url: string;
  is_purchased: boolean;
  is_certificate_generated: boolean;
}

export interface CertificatesParams {
  page?: number;
  per_page?: number;
  search?: string;
  only_with_certificate?: boolean;
}

export interface CertificatesResponse {
  certificates: Certificate[];
  total: number;
  page: number;
  per_page: number;
  totalPages: number;
}

export interface SubscriptionProduct {
  id: number;
  name: string;
}

export interface SubscriptionDates {
  start: string;
  end: string | null;
  renewal: string | null;
}

export interface SubscriptionBilling {
  cycle: string;
  amount: string;
  currency: string;
}

export interface SubscriptionActions {
  manageUrl: string;
  cancelUrl: string;
  renewUrl: string;
  changePaymentUrl: string;
}

export interface ActiveSubscription {
  subscription_id: number;
  status: string;
  plan_name: string;
  product: SubscriptionProduct[];
  dates: SubscriptionDates;
  billing: SubscriptionBilling;
  payment_method: string;
  actions: SubscriptionActions;
}

export interface LifetimeMembership {
  title: string;
  purchased: boolean;
  product: { id: number; name: string; price: string };
  purchase_details: {
    date_completed: string;
    total: string;
    currency: string;
  };
}

export interface SubscriptionResponse {
  subscriptions: ActiveSubscription[];
  active_subscription: ActiveSubscription | null;
  lifetime_membership: LifetimeMembership | null;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  type: "prime" | "lifetime" | "team";
  label: string;
  billing: string | null;
  featured: boolean;
  subtitle?: string;
  price: number | null;
  regular_price?: number | null;
  currency: string;
  product_id: number | null;
  checkout_url: string | null;
  /** Shown when checkout_url is null — admin-configurable invoice/contact URL. */
  request_invoice_url?: string | null;
  cta: string;
  features: PlanFeature[];
}

/** Shape of GET/POST /admin/subscription-plan-settings */
export interface SubscriptionPlanConfig {
  product_id: number;
  label: string;
  billing: string | null;
  featured: boolean;
  subtitle?: string;
  cta: string;
  request_invoice_url: string;
  features: PlanFeature[];
}

export interface SubscriptionPlanSettings {
  prime: SubscriptionPlanConfig;
  lifetime: SubscriptionPlanConfig;
  team: SubscriptionPlanConfig;
}

/** Shape of GET /admin/products */
export interface WcProduct {
  id: number;
  name: string;
  price: string;
}

export type PromoCardVariant = "hardcopy" | "team";

export interface SubscriptionPromoCard {
  id: string;
  variant: PromoCardVariant;
  title: string;
  description: string;
  button_label: string;
  button_url: string;
}

export interface SubscriptionPromosResponse {
  promos: SubscriptionPromoCard[];
}

export interface OrderItem {
  product_id: number;
  name: string;
  quantity: number;
  subtotal: number;
  total: number;
  thumbnail: string;
}

export interface OrderBilling {
  first_name: string;
  last_name: string;
  email: string;
  country: string;
}

/** Shape returned by GET /orders (list — no line items). */
export interface StudentOrder {
  id: number;
  status: string;
  total: number;
  currency: string;
  date_created: string | null;
  billing: OrderBilling;
}

/** Shape returned by GET /orders/{id} (detail — includes line items). */
export interface StudentOrderDetail extends StudentOrder {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
}

export interface StudentOrdersResponse {
  orders: StudentOrder[];
  total: number;
  page: number;
  per_page: number;
  totalPages: number;
}

export interface NavItem {
  slug: string;
  label: string;
  enabled: boolean;
}

export type NavigationSettings = Record<string, NavItem>;

export interface ColorSettings {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface CourseCategory {
  term_id: number;
  name: string;
  slug: string;
  count: number;
}

export interface AllCategoriesResponse {
  categories: CourseCategory[];
}

export interface UnlockCertificateResponse {
  course_id: number;
  credits_remaining: number;
  is_certificate_unlocked: string;
  is_certificate_generated: boolean;
  claimed_via_subscription?: boolean;
}

export interface GenerateCertificateResponse {
  course_id: number;
  is_certificate_unlocked?: string;
  is_certificate_generated: boolean;
  certificate_url?: string;
}

export interface CertificateOrderConfig {
  enabled: boolean;
  product_id: number;
  product_name: string;
  price: number | null;
  regular_price: number | null;
  currency: string;
}

export interface CertificateOrderPayload {
  course_id: number;
  full_name: string;
  email: string;
  phone?: string;
  address_line_1: string;
  city: string;
  postcode: string;
  country: string;
  delivery_notes?: string;
}

export interface CertificateOrderResponse {
  request_id: number;
  product_id: number;
  course_id: number;
}

export interface MiscellaneousSettings {
  order_certificate?: boolean;
  certificate_order_link?: string;
  transcript_order_link?: string;
}
