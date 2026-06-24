"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { businessDashboardService } from "@/lib/services/business-dashboard";
import { queryKeys } from "@/lib/utils/query-keys";
import type {
  AddLearnerPayload,
  AssignCoursePayload,
  BusinessListParams,
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

export function useBusinessCreditBalance() {
  return useQuery({
    queryKey: queryKeys.business.creditBalance,
    queryFn: () => businessDashboardService.getCreditBalance(),
    staleTime: LIST_STALE,
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

export function useBusinessSystemType() {
  return useQuery({
    queryKey: queryKeys.business.systemType,
    queryFn: () => businessDashboardService.getSystemType(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBusinessCreditTransactions(page = 1) {
  return useQuery({
    queryKey: queryKeys.business.creditTransactions(page),
    queryFn: () => businessDashboardService.getCreditTransactions(page),
  });
}

export function useBusinessCreditDiscountTiers() {
  return useQuery({
    queryKey: queryKeys.business.creditDiscountTiers,
    queryFn: () => businessDashboardService.getCreditDiscountTiers(),
  });
}

export function useBusinessCreditProduct() {
  return useQuery({
    queryKey: queryKeys.business.creditProduct,
    queryFn: () => businessDashboardService.getCreditProduct(),
  });
}

export function useBusinessLicencePricing() {
  return useQuery({
    queryKey: queryKeys.business.licencePricing,
    queryFn: () => businessDashboardService.getLicencePricing(),
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

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useAddBusinessLearner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddLearnerPayload) => businessDashboardService.addLearner(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business", "learners"] });
    },
  });
}

export function useUpdateBusinessLearner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      businessDashboardService.updateLearner(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business", "learners"] });
    },
  });
}

export function useConvertBusinessLearnerRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      businessDashboardService.convertLearnerRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business", "learners"] });
    },
  });
}

export function useAssignBusinessCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignCoursePayload) => businessDashboardService.assignCourse(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business"] });
    },
  });
}

export function useUpdateBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      businessDashboardService.updateProfile(id, data),
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
      qc.invalidateQueries({ queryKey: ["business"] });
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

export function useSwitchBusinessSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (systemType: "credits" | "subscription") =>
      businessDashboardService.switchSystem(systemType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.business.systemType });
      qc.invalidateQueries({ queryKey: queryKeys.business.profile });
    },
  });
}

export function usePurchaseBusinessCredits() {
  return useMutation({
    mutationFn: (quantity: number) => businessDashboardService.purchaseCredits(quantity),
  });
}

export function useAddBusinessManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; display_name?: string }) =>
      businessDashboardService.addManager(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business", "managers"] });
    },
  });
}
