"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentDashboardService } from "@/lib/services/student-dashboard";
import { queryKeys } from "@/lib/utils/query-keys";
import type {
  CertificatesParams,
  StudentCoursesParams,
  SubscriptionPlanSettings,
} from "@/types/student-dashboard";

export function useStudentSummary() {
  return useQuery({
    queryKey: queryKeys.student.summary,
    queryFn: () => studentDashboardService.getSummary(),
  });
}

export function useStudentCourses(params: StudentCoursesParams) {
  return useQuery({
    queryKey: queryKeys.student.courses(params),
    queryFn: () => studentDashboardService.getCourses(params),
  });
}

export function useStudentCertificates(params: CertificatesParams) {
  return useQuery({
    queryKey: queryKeys.student.certificates(params),
    queryFn: () => studentDashboardService.getCertificates(params),
  });
}

export function useStudentSubscription() {
  return useQuery({
    queryKey: queryKeys.student.subscription,
    queryFn: () => studentDashboardService.getSubscription(),
  });
}

export function useStudentOrders(page = 1, perPage = 20) {
  return useQuery({
    queryKey: queryKeys.student.orders(page),
    queryFn: () => studentDashboardService.getOrders(page, perPage),
  });
}

export function useStudentOrder(id: number | null) {
  return useQuery({
    queryKey: queryKeys.student.order(id ?? 0),
    queryFn: () => studentDashboardService.getOrder(id as number),
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: queryKeys.student.plans,
    queryFn: () => studentDashboardService.getSubscriptionPlans(),
  });
}

export function useDashboardColors() {
  return useQuery({
    queryKey: queryKeys.admin.colors,
    queryFn: () => studentDashboardService.getColorSettings(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardNav() {
  return useQuery({
    queryKey: queryKeys.admin.navigation,
    queryFn: () => studentDashboardService.getNavigationSettings(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscriptionPromos() {
  return useQuery({
    queryKey: queryKeys.admin.promos,
    queryFn: () => studentDashboardService.getPromos(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: () => studentDashboardService.getAllCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useShareCertificate() {
  return useMutation({
    mutationFn: ({ courseId, email }: { courseId: number; email: string }) =>
      studentDashboardService.shareCertificate(courseId, email),
  });
}

export function useStudentEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) => studentDashboardService.enrollCourse(courseId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student"] });
    },
  });
}

export function useAdminSubscriptionPlanSettings() {
  return useQuery({
    queryKey: queryKeys.admin.subscriptionPlanSettings,
    queryFn: () => studentDashboardService.getSubscriptionPlanSettings(),
    staleTime: 60 * 1000,
  });
}

export function useUpdateSubscriptionPlanSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SubscriptionPlanSettings>) =>
      studentDashboardService.updateSubscriptionPlanSettings(payload),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.admin.subscriptionPlanSettings, updated);
      // Invalidate the public plans cache so the subscription page refreshes.
      void qc.invalidateQueries({ queryKey: queryKeys.student.plans });
    },
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.admin.products,
    queryFn: () => studentDashboardService.getAdminProducts(),
    staleTime: 5 * 60 * 1000,
  });
}
