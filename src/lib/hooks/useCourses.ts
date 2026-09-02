"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { coursesService } from "@/lib/services/courses";
import { queryKeys } from "@/lib/utils/query-keys";
import type { CourseListFilters } from "@/types/course";

export function useCourses(filters: CourseListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.courses.list(filters),
    queryFn: () => coursesService.list(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCourse(slugOrId: string | number, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.courses.detail(slugOrId),
    queryFn: () => coursesService.detail(slugOrId),
    enabled: (opts?.enabled ?? true) && Boolean(slugOrId),
  });
}

export function useCourseCurriculum(idOrSlug: string | number, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.courses.curriculum(idOrSlug),
    queryFn: () => coursesService.curriculum(idOrSlug),
    enabled: (opts?.enabled ?? true) && Boolean(idOrSlug),
  });
}

/**
 * Courses ordered by student count — `GET /courses/popular`.
 *
 * Not `useCourses({ orderBy: "popularity" })`: `/courses` accepts `orderby` of
 * `date` or `title` only, so that spelling quietly returned the newest courses.
 */
export function usePopularCourses(perPage = 8) {
  return useQuery({
    queryKey: queryKeys.courses.popular(perPage),
    queryFn: () => coursesService.popular(perPage),
    staleTime: 5 * 60_000,
  });
}

export function useCourseCategories() {
  return useQuery({
    queryKey: queryKeys.courses.categories,
    queryFn: () => coursesService.categories(),
    staleTime: 5 * 60_000,
  });
}

export function useCourseReviews(idOrSlug: string | number, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.courses.reviews(idOrSlug),
    queryFn: () => coursesService.reviews(idOrSlug),
    enabled: (opts?.enabled ?? true) && Boolean(idOrSlug),
    staleTime: 60_000,
  });
}

export function useCourseRelated(idOrSlug: string | number, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.courses.related(idOrSlug),
    queryFn: () => coursesService.related(idOrSlug),
    enabled: (opts?.enabled ?? true) && Boolean(idOrSlug),
    staleTime: 5 * 60_000,
  });
}
