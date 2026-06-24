/**
 * Types for the B2B business dashboard, backed by the `lms-b2b/v1` REST API
 * (a headless facade over the wplms-business-dashboard plugin).
 *
 * All shapes here describe the `data` payload AFTER the `{ success, data }`
 * envelope is unwrapped by `proxyToWP`. The facade treats most domain payloads
 * as opaque, so several fields are intentionally permissive.
 */

// ─── Common ───────────────────────────────────────────────────────────────────

export interface BusinessListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}

/** Generic `{ items, total, pages }` envelope the B2B domain uses for lists. */
export interface B2BPaginated<T> {
  items: T[];
  total: number;
  pages: number;
  page?: number;
  per_page?: number;
}

// ─── Business / profile ─────────────────────────────────────────────────────────

export interface Business {
  id: number;
  user_id: number;
  company_name: string;
  business_email: string;
  phone: string;
  address: string;
  tax_id: string;
  industry: string;
  company_size: number | string;
  status: string;
  credit_balance: number;
  created_at: string;
  updated_at: string;
  logo_id: number;
  logo_url: string;
  system_type?: "credits" | "subscription";
}

// ─── Overview / summary ─────────────────────────────────────────────────────────

export interface BusinessSummary {
  total_courses: number;
  total_members: number;
  total_certificates: number;
  total_active: number;
  total_completed: number;
}

export interface CreditBalance {
  balance: number;
}

// ─── Learners / team ─────────────────────────────────────────────────────────────

export interface Learner {
  id: number;
  user_id: number;
  email: string;
  user_email?: string;
  display_name: string;
  role: "learner" | "manager";
  status: "active" | "inactive" | string;
  is_available?: boolean;
  assignment_status?: "assigned" | "enrolled" | "available";
  progress?: number;
  certificate_url?: string | null;
  start_date?: string | null;
  completion_date?: string | null;
  created_at?: string;
  quiz_scores?: {
    sum?: number;
    max_sum?: number;
    percentage?: number;
    total_quizzes?: number;
  };
}

/** Response from GET /courses/{id}/learners */
export interface CourseLearnersResponse {
  items?: Learner[];
  learners?: Learner[];
  members?: Learner[];
  total?: number;
  pages?: number;
  page?: number;
  per_page?: number;
  course_info?: {
    post_title?: string;
    ID?: number;
  };
}

export interface TeamResponse {
  members: Learner[];
  meta: {
    total: number;
    pages: number;
    current_page: number;
    per_page: number;
  };
}

// ─── Course assignments ──────────────────────────────────────────────────────────

export interface CourseAssignment {
  id: number;
  user_id: number;
  course_id: number;
  business_id: number;
  credits_used: number;
  status: string;
  course_name: string;
  user_name: string;
  created_at: string;
}

export interface AssignmentsResponse {
  status?: number;
  assignments: CourseAssignment[];
  total: number | string;
  total_pages?: number;
  page?: number;
  per_page?: number;
}

// ─── Assigned courses summary ────────────────────────────────────────────────────

export interface AssignedCourse {
  id: number;
  name: string;
  excerpt?: string;
  featured_image?: string;
  url?: string;
  total_lessons?: number;
}

export interface CoursesResponse {
  status?: number;
  courses: AssignedCourse[];
  total: number;
  pages?: number;
  page?: number;
  per_page?: number;
}

// ─── Reports ─────────────────────────────────────────────────────────────────────

export interface ReportCourse {
  id: string | number;
  name: string;
  assigned_count: string | number;
  in_progress_count: string | number;
  completed_count: string | number;
  certificate_count: string | number;
  first_assigned?: string;
  last_assigned?: string;
}

export interface ReportMember {
  id: string | number;
  name: string;
  email: string;
  role: string;
  assigned_count: string | number;
  in_progress_count: string | number;
  completed_count: string | number;
  certificate_count: string | number;
  last_activity?: string | null;
}

export interface ReportCertificate {
  id: string | number;
  course_name: string;
  learner_name: string;
  learner_email: string;
  certificate_url: string;
  completion_date?: string | null;
  assignment_date?: string;
  validation_status?: string;
}

// ─── Licences ───────────────────────────────────────────────────────────────────

export interface LicenceCourse {
  id: number;
  name: string;
  featured_image: string;
  price_per_licence: number;
}

export interface LicencePool {
  id: number;
  business_id: number;
  course_id: number;
  course_name: string;
  order_id: number;
  quantity: number;
  used: number;
  available: number;
  price_per_licence: number;
  discount_percent: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface LicenceCoursesResponse {
  status?: number;
  courses: LicenceCourse[];
  total: number;
  pages?: number;
}

export interface LicenceBalanceResponse {
  status?: number;
  pools: LicencePool[];
}

// ─── Certificates ────────────────────────────────────────────────────────────────

export interface BusinessCertificate {
  id: string | number;
  course_id?: number;
  course_name: string;
  learner_name?: string;
  learner_email?: string;
  certificate_url?: string;
  issue_date?: string | null;
  status?: string;
  total_learners?: number;
  certificates_issued?: number;
  first_assigned?: string;
  last_assigned?: string;
}

export interface CertificatesResponse {
  items: BusinessCertificate[];
  total: number;
  pages?: number;
  page?: number;
  per_page?: number;
}

// ─── Assignment list (WP parity) ───────────────────────────────────────────────

export interface AssignmentListCompletionStats {
  completed: number;
  active: number;
  expired: number;
  certificate_count: number;
}

export interface AssignmentListCourse {
  course_id: number;
  course_name: string;
  course_slug?: string;
  total_learners: number;
  completion_stats: AssignmentListCompletionStats;
  first_assigned?: string | null;
  last_assigned?: string | null;
  total_credits_used?: number;
  status?: string[];
}

export interface AssignmentListResponse {
  items?: AssignmentListCourse[];
  courses?: AssignmentListCourse[];
  total: number;
  pages?: number;
  page?: number;
  per_page?: number;
}

// ─── Learner courses (detail) ────────────────────────────────────────────────────

export interface LearnerCourseItem {
  id?: number;
  course_id: number;
  course_name: string;
  status?: string;
  progress?: number;
  certificate_url?: string | null;
  start_date?: string | null;
  completion_date?: string | null;
  created_at?: string;
}

export interface LearnerCoursesResponse {
  courses?: LearnerCourseItem[];
  items?: LearnerCourseItem[];
  total?: number;
  pages?: number;
}

// ─── Orders ─────────────────────────────────────────────────────────────────────

export interface BusinessOrderItem {
  name: string;
  qty: number;
}

export interface BusinessOrder {
  order_id: number;
  order_number: string;
  date: string | null;
  status: string;
  total: string | number;
  currency: string;
  items_count: number;
  items_summary?: BusinessOrderItem[];
  payment_method?: string;
  view_url?: string;
}

export interface BusinessOrdersResponse {
  items?: BusinessOrder[];
  orders?: BusinessOrder[];
  total: number;
  pages?: number;
  page?: number;
  per_page?: number;
}

// ─── Pricing / credits ─────────────────────────────────────────────────────────

export interface BusinessSystemType {
  system_type: "credits" | "subscription";
}

export interface CreditDiscountTier {
  id?: number;
  min_quantity: number;
  discount_percent: number;
}

export interface CreditProduct {
  id: number;
  name: string;
  price: number;
  currency?: string;
}

export interface LicencePricingTier {
  min_quantity: number;
  discount_percent: number;
}

export interface LicencePricing {
  tiers?: LicencePricingTier[];
  base_price?: number;
  currency?: string;
}

// ─── Credit transactions ─────────────────────────────────────────────────────────

export interface CreditTransaction {
  id: number;
  type: string;
  amount: number;
  balance_after?: number;
  description?: string;
  created_at: string;
}

export interface CreditTransactionsResponse {
  items?: CreditTransaction[];
  transactions?: CreditTransaction[];
  total: number;
  pages?: number;
}

// ─── Subscriptions ───────────────────────────────────────────────────────────────

export interface SubscriptionSummary {
  total_seats?: number;
  used_seats?: number;
  available_seats?: number;
  plan_name?: string;
  status?: string;
}

export interface AssignedSubscription {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  plan_name?: string;
  status?: string;
  assigned_at?: string;
}

// ─── Managers ──────────────────────────────────────────────────────────────────

export interface BusinessManager {
  id: number;
  user_id: number;
  display_name: string;
  email: string;
  status: string;
  role?: string;
}

export interface ManagersResponse {
  items?: BusinessManager[];
  managers?: BusinessManager[];
  total?: number;
}

// ─── Reviews ───────────────────────────────────────────────────────────────────

export interface ReviewHasResponse {
  has_review: boolean;
}

export interface SubmitReviewPayload {
  rating: number;
  feedback?: string;
  showcase_consent?: boolean;
}

// ─── Team mutations ──────────────────────────────────────────────────────────────

export interface AddLearnerPayload {
  email: string;
  first_name: string;
  last_name: string;
  /** Defaults to learner; required by b2b_team_members.role (NOT NULL). */
  role?: "learner" | "manager";
}

export interface CheckEmailUserData {
  id: number;
  first_name: string;
  last_name: string;
  display_name: string;
}

export interface CheckEmailResponse {
  exists: boolean;
  available?: boolean;
  is_team_member?: boolean;
  is_manager?: boolean;
  message?: string;
  user_data?: CheckEmailUserData;
}

export interface AssignCoursePayload {
  course_id: number;
  user_ids: number[];
  use_licence?: boolean;
}
