import { bffJson } from "@/lib/api/bff-client";
import type { CourseProgress } from "@/types/enrollment";

interface RawProgress {
  course_id: number;
  completed_units?: number;
  completed_lessons?: number;
  total_units?: number;
  total_lessons?: number;
  percent?: number;
  progress?: number;
  completed_unit_ids?: number[];
  completed_lesson_ids?: number[];
  last_unit_id?: number | null;
  last_lesson_id?: number | null;
}

export const progressService = {
  async forCourse(courseId: number): Promise<CourseProgress> {
    const data = await bffJson<RawProgress>(`/api/users/me/courses/${courseId}/progress`, {
      method: "GET",
    });
    const completed =
      data.completed_units ??
      data.completed_lessons ??
      data.completed_unit_ids?.length ??
      data.completed_lesson_ids?.length ??
      0;
    const total = data.total_units ?? data.total_lessons ?? 0;
    const percent =
      data.percent ?? data.progress ?? (total > 0 ? Math.round((completed / total) * 100) : 0);
    return {
      courseId: data.course_id ?? courseId,
      completedUnits: completed,
      totalUnits: total,
      percent,
      completedUnitIds: data.completed_unit_ids ?? data.completed_lesson_ids ?? [],
      lastUnitId: data.last_unit_id ?? data.last_lesson_id ?? null,
    };
  },
};
