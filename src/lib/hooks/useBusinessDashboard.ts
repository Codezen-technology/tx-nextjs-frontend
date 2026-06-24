"use client";

import { useQuery } from "@tanstack/react-query";
import { businessDashboardService } from "@/lib/services/business-dashboard";
import { queryKeys } from "@/lib/utils/query-keys";
import type { BusinessListParams } from "@/types/business-dashboard";

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

export function useBusinessAssignments(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: queryKeys.business.assignments(params),
    queryFn: () => businessDashboardService.getAssignments(params),
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
