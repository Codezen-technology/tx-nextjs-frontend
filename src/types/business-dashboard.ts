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
  orderby?: string;
  order?: "asc" | "desc";
  /** `course-cat` term ids. Server-side filter on `GET /courses`. */
  taxonomy?: number[];
  // Tier B filters, accepted by the report and certificate listings.
  course_id?: number;
  learner_id?: number;
  date_from?: string;
  date_to?: string;
  role?: string;
  /** Omitted means "use the business passing mark" — never send a default. */
  pass_mark?: number;
  /** Tier C — filters by department membership across the report and list routes. */
  department_id?: number;
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
  // Nullable columns: null means never set, '' means explicitly cleared. The API
  // preserves that distinction rather than collapsing both to ''.
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  industry: string | null;
  company_size: number | string;
  status: string;
  credit_balance: number;
  created_at: string;
  updated_at: string;
  logo_id: number;
  logo_url: string | null;
  system_type?: "credits" | "subscription";
}

// ─── Overview / summary ─────────────────────────────────────────────────────────

/** One quiz attempt row from `GET /courses/{id}/learner/{id}/quiz-scores`. */
export interface LearnerQuizScore {
  quiz_id: number;
  quiz_name: string;
  score: number;
  max_score: number;
  percentage: number;
}

/**
 * Quiz detail for one learner on one course.
 *
 * There is deliberately no per-quiz `passed` or attempt date: WPLMS stores marks
 * as post meta keyed by user id and records neither, so the backend does not
 * invent them. Pass/fail is `percentage` against the business passing mark.
 */
export interface LearnerQuizScoresResponse {
  quiz_scores: LearnerQuizScore[];
  percentage: number;
  score: number;
  max_score: number;
  total_quizzes: number;
}

/**
 * Which of a set of learners already hold a subscription seat.
 *
 * Matters when assigning: a subscription-covered learner does not consume a
 * licence, so a manager can spend the pool deliberately rather than discovering
 * it is empty on submit.
 */
export interface LearnerSubscriptionCheck {
  has_subscription: boolean;
  message?: string;
  error?: string;
}

export interface LearnerSubscriptionCheckResponse {
  success: boolean;
  results: Record<string, LearnerSubscriptionCheck>;
  total_checked: number;
  valid_learners: number;
  invalid_learners: number;
}

// ─── Departments (Tier C) ────────────────────────────────────────────────────────

export interface Department {
  id: number;
  parent_id: number;
  name: string;
  /**
   * Only the flat list is documented to carry this — the tree nodes in
   * `departments` omit it. Optional so a node cannot silently render
   * "undefined members".
   */
  member_count?: number;
}

/** A department with its subtree. The list endpoint returns both shapes. */
export interface DepartmentNode extends Department {
  children: DepartmentNode[];
}

export interface DepartmentsResponse {
  /** Nested, for the tree UI. */
  departments: DepartmentNode[];
  /** Flat, for every `<select>`. */
  flat: Department[];
}

export interface MemberDepartmentsResponse {
  departments: Department[];
}

// ─── Saved report views (Tier C) ─────────────────────────────────────────────────

/**
 * A saved set of report filters, shared across the whole business rather than
 * per user. `filters` is an opaque blob owned by this client — the backend
 * stores and returns it verbatim, so adding a filter here needs no backend
 * change.
 */
export interface SavedReportView {
  id: number;
  business_id: number;
  report_type: string;
  name: string;
  filters: Record<string, string | number | undefined>;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// ─── Bulk import (Tier C) ────────────────────────────────────────────────────────

export interface BulkImportMember {
  email: string;
  first_name?: string;
  last_name?: string;
  department_ids?: number[];
  course_ids?: number[];
}

export type BulkImportCode =
  | "already_member"
  | "invalid_email"
  | "no_licence_available"
  | "department_not_found";

export interface BulkImportRowResult {
  row: number;
  email: string;
  status: "added" | "skipped";
  code?: BulkImportCode;
  message?: string;
  user_id?: number;
}

export interface BulkImportResult {
  added: number;
  skipped: number;
  results: BulkImportRowResult[];
}

// ─── Settings (Tier B) ───────────────────────────────────────────────────────────

export interface BusinessSettings {
  business_id: number;
  passing_mark: number;
  certificate_self_download: boolean;
  /**
   * True once onboarding completes. `certificate_self_download` is a one-way
   * switch: when this is set, render a "Locked" chip rather than a toggle.
   */
  certificate_self_download_locked: boolean;
  email_certificate_on_completion: boolean;
  onboarding_complete: boolean;
  platform_subdomain: string;
  /** Stored but inert — the backend names these deliberately non-functional. */
  mfa_enabled: boolean;
  integration_slack: boolean;
  integration_teams: boolean;
  integration_genai: boolean;
  company_name: string;
  company_size: number;
}

export type BusinessSettingsUpdate = Partial<
  Pick<
    BusinessSettings,
    | "passing_mark"
    | "certificate_self_download"
    | "email_certificate_on_completion"
    | "platform_subdomain"
    | "mfa_enabled"
    | "integration_slack"
    | "integration_teams"
    | "integration_genai"
    | "company_name"
    | "company_size"
  >
>;

export interface OnboardingPayload extends BusinessSettingsUpdate {
  display_name?: string;
}

// ─── Activity feed (Tier B) ──────────────────────────────────────────────────────

export interface ActivityEvent {
  learner_id: number;
  learner_name: string;
  course_id: number;
  course_title: string;
  type: "completed" | "progress";
  progress: number;
  event_time: string;
}

export interface ActivityResponse {
  items: ActivityEvent[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
}

// ─── Learner reports (Tier B) ────────────────────────────────────────────────────

export type ReportStatus = "all" | "completed" | "in_progress" | "not_started" | "failed";

export interface LearnerCourseRecord {
  learner_id: number;
  learner_name: string;
  learner_email: string;
  course_id: number;
  course_title: string;
  /** Derived, not stored. `completed` downgrades to `failed` below the pass mark. */
  status: Exclude<ReportStatus, "all">;
  progress: number;
  score: number | null;
  completion_date: string | null;
  enrolled_at: string | null;
  last_accessed: string | null;
}

export interface LearnerCoursesReport {
  items: LearnerCourseRecord[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
  /** The effective pass mark, echoed back — omitted requests use the business setting. */
  pass_mark: number;
}

export interface MatrixLearner {
  id: number;
  name: string;
  email: string;
}

export interface MatrixCourse {
  course_id: number;
  title: string;
}

export interface MatrixCourseTotal {
  course_id: number;
  enrolled: number;
  completed: number;
  completion_rate: number;
}

export interface TrainingMatrix {
  pass_mark: number;
  learners: MatrixLearner[];
  courses: MatrixCourse[];
  /** Sparse — a learner with no assignment for a course simply has no cell. */
  cells: LearnerCourseRecord[];
  course_totals: MatrixCourseTotal[];
}

export interface TeamStats {
  total: number;
  enrolled: number;
  unassigned: number;
  pending: number;
  archived: number;
}

export interface AccountActionResult {
  sent: boolean;
  email?: string;
  action?: string;
}

export interface RemindResult {
  sent: number;
  failed: number;
  /** The population selected, not only the successes — 0 means nobody was behind. */
  learners: number;
  courses: number;
  course_id?: number;
}

export interface SeatRosterRow {
  seat_id: number;
  subscription_id: number;
  plan_type: string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  status: string;
  assigned_at: string | null;
  expires_at?: string | null;
}

export interface SeatRosterResponse {
  items: SeatRosterRow[];
  total: number;
  pages: number;
  page?: number;
  per_page?: number;
}

/** Result of `POST /businesses/{business_id}/logo`. */
export interface BusinessLogo {
  logo_id: number;
  logo_url: string;
}

export interface BusinessSummary {
  total_courses: number;
  total_members: number;
  total_certificates: number;
  total_active: number;
  /** The stored status column. Not the same thing as `enrolments_completed`. */
  total_completed: number;
  // Tier B additions — pass-mark aware, which `total_completed` is not.
  total_enrolments?: number;
  enrolments_completed?: number;
  total_in_progress?: number;
  compliance_rate?: number;
}

// ─── Learners / team ─────────────────────────────────────────────────────────────

export interface Learner {
  id: number;
  user_id: number;
  email: string;
  /**
   * Wire-only. Older builds send the address here instead of `email`; the
   * service collapses the two, so components read `email`.
   */
  user_email?: string;
  display_name: string;
  role: "learner" | "manager";
  status: "active" | "inactive" | string;
  /** Null until the learner first signs in — drives the "pending" display status. */
  last_login?: string | null;
  departments?: { id: number; name: string }[];
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

/**
 * Wire shape of `GET /courses/{id}/learners` — the list arrives under one of
 * three keys depending on backend version. Only the service should see this;
 * `getCourseLearners()` normalises it to `CourseLearnersResponse`.
 */
export interface CourseLearnersWire {
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

export interface CourseLearnersResponse {
  items: Learner[];
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

/** Learner row from GET /courses/{id}/available-learners */
export interface AvailableLearner {
  id: number;
  display_name: string;
  email: string;
  status?: string | number;
  is_available: boolean;
  assignment_status?: "assigned" | "enrolled" | "available" | "wplms_enrolled";
}

export interface AvailableLearnersResponse {
  items: AvailableLearner[];
  total: number;
  pages?: number;
  page?: number;
  per_page?: number;
}

// ─── Course assignments ──────────────────────────────────────────────────────────

export interface CourseAssignment {
  id: number;
  user_id: number;
  course_id: number;
  business_id: number;
  credits_used: number;
  assignment_type?: "subscription" | "licence" | "credit";
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

export interface CourseCategoryRef {
  id: number;
  name: string;
  slug?: string;
}

/** Item from `GET /course-categories` — exclusions already applied server-side. */
export interface BusinessCourseCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
}

export interface AssignedCourse {
  id: number;
  name: string;
  excerpt?: string;
  description?: string;
  featured_image?: string;
  url?: string;
  author?: string;
  total_lessons?: number;
  /** Access period in seconds, not study time. 0 or absent means no expiry. */
  duration?: number;
  rating_count?: number;
  average_rating?: number;
  has_certificate?: boolean;
  /**
   * Authoritative for rendering — the resolved `course-cat` terms.
   * `courseCat` below is the raw term-id array WPLMS stores on the post and is
   * kept only so the client can filter without a second lookup.
   */
  course_categories?: CourseCategoryRef[];
  /** Raw `course-cat` term ids. Never render these; use `course_categories`. */
  courseCat?: number[];
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

/**
 * Wire shape of a row from `GET /certificates` — nested course and user
 * objects. `businessDashboardService.getCertificates()` flattens it; only the
 * service should ever see this type.
 */
export interface BusinessCertificateWire {
  id: string | number;
  course?: { id?: number; name?: string };
  user?: { id?: number; name?: string; email?: string };
  status?: string;
  issued_date?: string | null;
  expiry_date?: string | null;
  certificate_url?: string | null;
}

/** Flattened certificate register row. */
export interface BusinessCertificate {
  id: string | number;
  course_id: number;
  course_name: string;
  user_id: number;
  learner_name: string;
  learner_email: string;
  certificate_url: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  status: string;
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

/**
 * Wire shape of `GET /courses/assignment-list` — `items` on newer builds,
 * `courses` on older ones. `getAssignmentList()` normalises it.
 */
export interface AssignmentListWire {
  items?: AssignmentListCourse[];
  courses?: AssignmentListCourse[];
  total: number;
  pages?: number;
  page?: number;
  per_page?: number;
}

export interface AssignmentListResponse {
  items: AssignmentListCourse[];
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
  /** Null unless the site answers `b2b_dashboard_order_invoice_url`. */
  invoice_url?: string | null;
  is_paid?: boolean;
  billing_name?: string;
}

export interface BusinessOrdersResponse {
  items?: BusinessOrder[];
  orders?: BusinessOrder[];
  total: number;
  pages?: number;
  page?: number;
  per_page?: number;
}

// ─── Pricing ───────────────────────────────────────────────────────────────────

// ─── Subscriptions ───────────────────────────────────────────────────────────────

/**
 * Seat totals per plan type, e.g. { yearly: { total, assigned, available } }.
 * The API keys this by plan_type — it is not a flat object.
 */
export type SubscriptionSummary = Record<string, SubscriptionPlanTotals>;

export interface SubscriptionPlanTotals {
  total: number;
  assigned: number;
  available: number;
}

/**
 * A subscription row. `/businesses/subscriptions/assigned` returns these, not
 * per-member rows — the seated learners live under `/{id}/seats`.
 */
export interface AssignedSubscription {
  id: number;
  business_id: number;
  plan_type: string;
  status: string;
  total_seats: number;
  assigned_seats: number;
  available_seats: number;
  start_date: string | null;
  end_date: string | null;
  wc_reference_id: number | null;
  wc_reference_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** A single seat on a subscription, with its learner when assigned. */
export interface SubscriptionSeat {
  id: number;
  subscription_id: number;
  business_id: number;
  learner_id: number | null;
  learner_name?: string | null;
  learner_email?: string | null;
  status: string;
  assigned_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SubscriptionSeatsResponse {
  seats: SubscriptionSeat[];
  counts: {
    total: number;
    available: number;
    assigned: number;
    suspended: number;
  };
}

// ─── Managers ──────────────────────────────────────────────────────────────────

export interface BusinessManager {
  id: number;
  user_id: number;
  business_id?: number;
  display_name: string;
  /**
   * The API returns `user_email`. `email` is kept because older callers read it,
   * but it is not populated by lms-b2b/v1 — read `user_email`.
   */
  user_email: string;
  email?: string;
  status: string;
  role?: string;
  business_name?: string;
  created_at?: string;
  updated_at?: string;
}

/** manager_id -> capability -> granted. */
export type ManagerPermissions = Record<string, boolean>;

export interface ManagerCapabilitiesResponse {
  permissions: ManagerPermissions;
  available: Record<string, string> | string[];
}

export interface ManagerEmailCheck {
  exists: boolean;
  is_manager: boolean;
  user_data?: {
    id: number;
    first_name: string;
    last_name: string;
    display_name: string;
  };
}

/** Wire shape of `GET /managers` — `items` or `managers` by build. */
export interface ManagersWire {
  items?: BusinessManager[];
  managers?: BusinessManager[];
  total?: number;
}

export interface ManagersResponse {
  managers: BusinessManager[];
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

/** Response from GET lms-b2b/v1/status — public plugin activation probe. */
export interface B2BPluginStatus {
  active: boolean;
  ready: boolean;
  plugin?: string;
  version?: string;
  namespace?: string;
  mode?: "standalone" | "proxy";
  missing_dependencies?: string[];
  timestamp?: string;
}

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
}
