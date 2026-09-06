"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { businessDashboardService } from "@/lib/services/business-dashboard";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { queryKeys } from "@/lib/utils/query-keys";
import type {
  AddLearnerPayload,
  AssignCoursePayload,
  BusinessListParams,
  BulkImportMember,
  BusinessSettingsUpdate,
  OnboardingPayload,
  SubmitReviewPayload,
} from "@/types/business-dashboard";

const LIST_STALE = 60 * 1000;

export function useBusinessSummary() {
  return useQuery({
    queryKey: queryKeys.business.summary,
    queryFn: () => businessDashboardService.getSummary(),
    staleTime: LIST_STALE,
  });
}

export function useBusinessProfile() {
  return useQuery({
    queryKey: queryKeys.business.profile,
    queryFn: () => businessDashboardService.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBusinessLearners(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.learners(params),
    queryFn: () => businessDashboardService.getLearners(params),
  });
}

export function useBusinessLearner(id: number | null) {
  return useQuery({
    queryKey: queryKeys.business.learner(id ?? 0),
    queryFn: () => businessDashboardService.getLearner(id as number),
    enabled: id != null,
  });
}

export function useBusinessLearnerCourses(
  learnerId: number | null,
  params: BusinessListParams = {},
) {
  return useQuery({
    queryKey: queryKeys.business.learnerCourses(learnerId ?? 0, params),
    queryFn: () => businessDashboardService.getLearnerCourses(learnerId as number, params),
    enabled: learnerId != null,
  });
}

export function useBusinessAssignments(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.assignments(params),
    queryFn: () => businessDashboardService.getAssignments(params),
  });
}

export function useBusinessAssignmentList(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.assignmentList(params),
    queryFn: () => businessDashboardService.getAssignmentList(params),
  });
}

export function useBusinessCourses(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.courses(params),
    queryFn: () => businessDashboardService.getCourses(params),
  });
}

export function useBusinessCourseLearners(
  courseId: number | null,
  params: BusinessListParams = {},
) {
  return useQuery({
    queryKey: queryKeys.business.courseLearners(courseId ?? 0, params),
    queryFn: () => businessDashboardService.getCourseLearners(courseId as number, params),
    enabled: courseId != null,
  });
}

export function useBusinessAvailableLearners(
  courseId: number | null,
  params: BusinessListParams = {},
) {
  return useQuery({
    queryKey: queryKeys.business.availableLearners(courseId ?? 0, params),
    queryFn: () => businessDashboardService.getAvailableLearners(courseId as number, params),
    enabled: courseId != null,
  });
}

export function useBusinessLicenceCourses(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.licenceCourses(params),
    queryFn: () => businessDashboardService.getLicenceCourses(params),
  });
}

export function useBusinessLicenceBalance() {
  return useQuery({
    queryKey: queryKeys.business.licenceBalance,
    queryFn: () => businessDashboardService.getLicenceBalance(),
    staleTime: LIST_STALE,
  });
}

export function useBusinessReportCourses(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.reportCourses(params),
    queryFn: () => businessDashboardService.getReportCourses(params),
  });
}

export function useBusinessReportMembers(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.reportMembers(params),
    queryFn: () => businessDashboardService.getReportMembers(params),
  });
}

export function useBusinessReportCertificates(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.reportCertificates(params),
    queryFn: () => businessDashboardService.getReportCertificates(params),
  });
}

export function useBusinessCertificates(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.certificates(params),
    queryFn: () => businessDashboardService.getCertificates(params),
  });
}

export function useBusinessOrders(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.orders(params),
    queryFn: () => businessDashboardService.getOrders(params),
  });
}

export function useBusinessLicencePricing() {
  return useQuery({
    queryKey: queryKeys.business.licencePricing,
    queryFn: () => businessDashboardService.getLicencePricing(),
  });
}

/**
 * The aggregated active subscription (seats + renewal date), from
 * `GET /businesses/subscriptions/active`. The server sums across every
 * active subscription, so the figure is right past the first page — the
 * client-side sum this replaced was capped at one `?per_page=50` page.
 */
export function useBusinessActiveSubscription() {
  return useQuery({
    queryKey: queryKeys.business.activeSubscription,
    queryFn: () => businessDashboardService.getActiveSubscription(),
    staleTime: LIST_STALE,
  });
}

export function useBusinessSubscriptionSummary() {
  return useQuery({
    queryKey: queryKeys.business.subscriptionSummary,
    queryFn: () => businessDashboardService.getSubscriptionSummary(),
  });
}

export function useBusinessSubscriptionAssigned(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.subscriptionAssigned(params),
    queryFn: () => businessDashboardService.getAssignedSubscriptions(params),
  });
}

export function useBusinessCourseCategories() {
  return useQuery({
    queryKey: queryKeys.business.courseCategories,
    queryFn: () => businessDashboardService.getCourseCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBusinessExcludedCategories() {
  return useQuery({
    queryKey: queryKeys.business.excludedCategories,
    queryFn: () => businessDashboardService.getExcludedCategories(),
  });
}

export function useBusinessManagers(businessId: number | null) {
  return useQuery({
    queryKey: queryKeys.business.managers(businessId ?? 0),
    queryFn: () => businessDashboardService.getManagers(businessId as number),
    enabled: businessId != null,
  });
}

export function useBusinessReviewHas() {
  return useQuery({
    queryKey: queryKeys.business.reviewHas,
    queryFn: () => businessDashboardService.hasReview(),
  });
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: queryKeys.business.settings,
    queryFn: () => businessDashboardService.getSettings(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * The sector vocabulary. Effectively static — it changes only when the backend
 * is redeployed — so it is fetched once and kept for the session.
 */
export function useSectors() {
  return useQuery({
    queryKey: queryKeys.business.sectors,
    queryFn: () => businessDashboardService.getSectors(),
    staleTime: Infinity,
    gcTime: Infinity,
    // One retry, then give up and let the caller degrade: the wizard treats an
    // unreachable vocabulary as "sector not answerable" rather than hanging on
    // a list it will never get.
    retry: 1,
  });
}

export function useBusinessActivity(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.activity(params),
    queryFn: () => businessDashboardService.getActivity(params),
    staleTime: LIST_STALE,
  });
}

export function useLearnerCoursesReport(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.learnerCoursesReport(params),
    queryFn: () => businessDashboardService.getLearnerCoursesReport(params),
  });
}

export function useTrainingMatrix(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.trainingMatrix(params),
    queryFn: () => businessDashboardService.getTrainingMatrix(params),
  });
}

/** Course id + title only — much cheaper than pulling the whole matrix for a select. */
export function useReportCourseOptions() {
  return useQuery({
    queryKey: queryKeys.business.reportCourseOptions,
    queryFn: () => businessDashboardService.getReportCourseOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeamStats(params: { department_id?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.business.teamStats(params),
    queryFn: () => businessDashboardService.getTeamStats(params),
    staleTime: LIST_STALE,
  });
}

/**
 * Subscription coverage for a page of learners.
 *
 * Keyed on the ids so it refetches when the visible set changes, and disabled
 * until there is both a business and at least one learner. The backend caps the
 * batch at 100, which matches the modal's page size.
 */
export function useLearnerSubscriptionChecks(learnerIds: number[], businessId: number | null) {
  const ids = [...learnerIds].sort((a, b) => a - b);

  return useQuery({
    queryKey: queryKeys.business.learnerSubscriptionChecks(ids),
    queryFn: () => businessDashboardService.checkLearnersSubscriptions(ids, businessId as number),
    enabled: businessId != null && ids.length > 0,
    staleTime: LIST_STALE,
  });
}

export function useSeatRoster(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.seatRoster(params),
    queryFn: () => businessDashboardService.getSeatRoster(params),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.business.departments,
    queryFn: () => businessDashboardService.getDepartments(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMemberDepartments(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.business.memberDepartments(userId ?? 0),
    queryFn: () => businessDashboardService.getMemberDepartments(userId as number),
    enabled: userId != null,
  });
}

export function useSavedReports(reportType = "learner-courses") {
  return useQuery({
    queryKey: queryKeys.business.savedReports(reportType),
    queryFn: () => businessDashboardService.getSavedReports(reportType),
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useCheckLearnerEmail(email: string, enabled: boolean) {
  const debounced = useDebounce(email.trim(), 500);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debounced);

  return useQuery({
    queryKey: queryKeys.business.checkEmail(debounced),
    queryFn: () => businessDashboardService.checkLearnerEmail(debounced),
    enabled: enabled && valid && debounced.length > 0,
    staleTime: 30_000,
  });
}

export function useAddBusinessLearner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddLearnerPayload) => businessDashboardService.addLearner(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.learnersRoot });
    },
  });
}

export function useUpdateBusinessLearner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      businessDashboardService.updateLearner(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.learnersRoot });
    },
  });
}

export function useConvertBusinessLearnerRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      businessDashboardService.convertLearnerRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.learnersRoot });
    },
  });
}

export function useAssignBusinessCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignCoursePayload) => businessDashboardService.assignCourse(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.root });
    },
  });
}

export function useRevokeLicence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: number) => businessDashboardService.revokeLicence(assignmentId),
    onSuccess: () => {
      // Revoking moves a seat back into the pool, so balances and every
      // assignment listing are both stale.
      qc.invalidateQueries({ queryKey: queryKeys.business.root });
    },
  });
}

export function useLearnerQuizScores(courseId: number | null, userId: number | null) {
  return useQuery({
    queryKey: queryKeys.business.learnerQuizScores(courseId ?? 0, userId ?? 0),
    queryFn: () =>
      businessDashboardService.getLearnerQuizScores(courseId as number, userId as number),
    enabled: courseId != null && userId != null,
    staleTime: LIST_STALE,
  });
}

export function useUpdateBusinessSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BusinessSettingsUpdate) =>
      businessDashboardService.updateSettings(payload),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.business.settings, data);
      // The passing mark changes what every report counts as passed.
      qc.invalidateQueries({ queryKey: queryKeys.business.profile });
    },
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OnboardingPayload) =>
      businessDashboardService.completeOnboarding(payload),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.business.settings, data);
      qc.invalidateQueries({ queryKey: queryKeys.business.root });
    },
  });
}

export function useResetSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => businessDashboardService.resetSettings(),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.business.settings, data);
    },
  });
}

export function useInviteLearner() {
  return useMutation({
    mutationFn: (id: number) => businessDashboardService.inviteLearner(id),
  });
}

export function useSendPasswordReset() {
  return useMutation({
    mutationFn: (id: number) => businessDashboardService.sendPasswordReset(id),
  });
}

export function useRemindCourse() {
  return useMutation({
    mutationFn: (courseId: number) => businessDashboardService.remindCourse(courseId),
  });
}

export function useRemindBehind() {
  return useMutation({
    mutationFn: (
      filters: { course_id?: number; department_id?: number; learner_id?: number } = {},
    ) => businessDashboardService.remindBehind(filters),
  });
}

/** Department writes all shift member counts, so the whole list is refetched. */
function invalidateDepartments(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.business.departments });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; parent_id?: number }) =>
      businessDashboardService.createDepartment(payload),
    onSuccess: () => invalidateDepartments(qc),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; name?: string; parent_id?: number }) =>
      businessDashboardService.updateDepartment(id, payload),
    onSuccess: () => invalidateDepartments(qc),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => businessDashboardService.deleteDepartment(id),
    onSuccess: () => invalidateDepartments(qc),
  });
}

export function useSetMemberDepartments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, departmentIds }: { userId: number; departmentIds: number[] }) =>
      businessDashboardService.setMemberDepartments(userId, departmentIds),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.business.memberDepartments(variables.userId),
      });
      // Member counts on the department list move with every membership change.
      invalidateDepartments(qc);
    },
  });
}

function invalidateSavedReports(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.business.savedReportsRoot });
}

export function useCreateSavedReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      filters: Record<string, string | number | undefined>;
      report_type?: string;
    }) => businessDashboardService.createSavedReport(payload),
    onSuccess: () => invalidateSavedReports(qc),
  });
}

export function useUpdateSavedReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: number;
      name?: string;
      filters?: Record<string, string | number | undefined>;
    }) => businessDashboardService.updateSavedReport(id, payload),
    onSuccess: () => invalidateSavedReports(qc),
  });
}

export function useDeleteSavedReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => businessDashboardService.deleteSavedReport(id),
    onSuccess: () => invalidateSavedReports(qc),
  });
}

export function useBulkImportLearners() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (members: BulkImportMember[]) =>
      businessDashboardService.bulkImportLearners(members),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.root });
    },
  });
}

export function useUpdateBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ownerUserId, data }: { ownerUserId: number; data: Record<string, unknown> }) =>
      businessDashboardService.updateProfile(ownerUserId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.profile });
    },
  });
}

export function useUploadBusinessLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ businessId, file }: { businessId: number; file: File }) =>
      businessDashboardService.uploadLogo(businessId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.profile });
    },
  });
}

export function useDeleteBusinessLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (businessId: number) => businessDashboardService.deleteLogo(businessId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.profile });
    },
  });
}

export function useGenerateBusinessCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { user_id: number; course_id: number }) =>
      businessDashboardService.generateCertificate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.root });
    },
  });
}

export function useSubmitBusinessReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitReviewPayload) => businessDashboardService.submitReview(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.reviewHas });
    },
  });
}

export function useBusinessSubscription(id: number | null) {
  return useQuery({
    queryKey: queryKeys.business.subscription(id ?? 0),
    queryFn: () => businessDashboardService.getSubscription(id as number),
    enabled: typeof id === "number" && id > 0,
  });
}

/** Seats for one subscription. Disabled until a subscription is selected. */
export function useSubscriptionSeats(id: number | null) {
  return useQuery({
    queryKey: queryKeys.business.subscriptionSeats(id ?? 0),
    queryFn: () => businessDashboardService.getSubscriptionSeats(id as number),
    enabled: typeof id === "number" && id > 0,
  });
}

function invalidateSubscriptions(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.business.subscriptions });
  // Seat changes also move surfaces keyed outside the subscriptions prefix:
  // the cross-subscription roster on the same page, the Overview KPI, the
  // assigned list, the summary and the assign-modal coverage badges.
  qc.invalidateQueries({ queryKey: queryKeys.business.seatRosterRoot });
  qc.invalidateQueries({ queryKey: queryKeys.business.subscriptionAssignedRoot });
  qc.invalidateQueries({ queryKey: queryKeys.business.activeSubscription });
  qc.invalidateQueries({ queryKey: queryKeys.business.subscriptionSummary });
  qc.invalidateQueries({ queryKey: queryKeys.business.learnerSubscriptionChecksRoot });
}

export function useSetSubscriptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "on-hold" }) =>
      businessDashboardService.setSubscriptionStatus(id, status),
    onSuccess: () => invalidateSubscriptions(qc),
  });
}

export function useRevokeSubscriptionSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, seatId }: { id: number; seatId: number }) =>
      businessDashboardService.revokeSubscriptionSeat(id, seatId),
    onSuccess: () => invalidateSubscriptions(qc),
  });
}

export function useAssignUserToSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { user_id: number; subscription_type: string }) =>
      businessDashboardService.assignUserToSubscription(payload),
    onSuccess: () => invalidateSubscriptions(qc),
  });
}

export function useAddBusinessManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      business_id: number;
      email: string;
      first_name: string;
      last_name: string;
    }) => businessDashboardService.addManager(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.managersRoot });
    },
  });
}

export function useUpdateBusinessManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; business_id: number; status?: string }) =>
      businessDashboardService.updateManager(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.managersRoot });
    },
  });
}

export function useSetBusinessManagerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      businessDashboardService.setManagerStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.managersRoot });
    },
  });
}

export function useDeleteBusinessManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => businessDashboardService.deleteManager(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.managersRoot });
    },
  });
}

/** Manager capabilities. Disabled until a manager is selected. */
export function useManagerCapabilities(managerId: number | null) {
  return useQuery({
    queryKey: queryKeys.business.managerCapabilities(managerId ?? 0),
    queryFn: () => businessDashboardService.getManagerCapabilities(managerId as number),
    enabled: typeof managerId === "number" && managerId > 0,
  });
}

export function useUpdateManagerPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      managerId,
      permissions,
    }: {
      managerId: number;
      permissions: Record<string, boolean>;
    }) => businessDashboardService.updateManagerPermissions(managerId, permissions),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.business.managerCapabilities(variables.managerId),
      });
    },
  });
}

/** Probe wp-lms-b2b-rest-api via GET /status — null when plugin inactive (404). */
export function useB2BPluginStatus() {
  return useQuery({
    queryKey: queryKeys.business.pluginStatus,
    queryFn: () => businessDashboardService.getPluginStatus(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/** True when the B2B REST API plugin is loaded (active). */
export function useB2BPluginActive(): boolean {
  const { data } = useB2BPluginStatus();
  return !!data?.active;
}
