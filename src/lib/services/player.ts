import { bffJson } from "@/lib/api/bff-client";
import type {
  IAssignment,
  ICourseReview,
  IMyReview,
  IPlayerCourse,
  IQuiz,
  IQuizQuestion,
  IQuizSubmitResult,
  IUnitItem,
  QuizAnswers,
} from "@/types/player";

/** All course-player calls route through the BFF (`/api/*`). Tokens stay server-side. */
export const playerService = {
  // ─── Course ──────────────────────────────────────────────────────────────
  async status(courseId: number): Promise<IPlayerCourse> {
    return bffJson<IPlayerCourse>(`/api/courses/${courseId}/player-status`, { method: "GET" });
  },

  async finish(courseId: number): Promise<{ status: string; finished?: { message: string } }> {
    return bffJson(`/api/courses/${courseId}/finish`, { method: "POST" });
  },

  // ─── Unit ────────────────────────────────────────────────────────────────
  async unitContent(unitId: number, courseId: number): Promise<IUnitItem> {
    return bffJson<IUnitItem>(`/api/units/${unitId}/player-content?course_id=${courseId}`, {
      method: "GET",
    });
  },

  async completeUnit(unitId: number, courseId: number, progress?: number): Promise<unknown> {
    return bffJson(`/api/units/${unitId}/player-complete`, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId, progress }),
    });
  },

  // ─── Quiz ────────────────────────────────────────────────────────────────
  async quiz(quizId: number, courseId: number): Promise<IQuiz> {
    return bffJson<IQuiz>(`/api/quizzes/${quizId}/full?course_id=${courseId}`, { method: "GET" });
  },

  async startQuiz(quizId: number, courseId: number): Promise<unknown> {
    return bffJson(`/api/quizzes/${quizId}/start`, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
    });
  },

  async retakeQuiz(quizId: number, courseId: number): Promise<unknown> {
    return bffJson(`/api/quizzes/${quizId}/retake`, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
    });
  },

  async submitQuiz(
    quizId: number,
    courseId: number,
    quiz: IQuiz,
    answers: QuizAnswers,
  ): Promise<IQuizSubmitResult> {
    // Echo the quiz back with each question's marked answer, matching the
    // grading contract the backend ported from the plugin.
    const results: IQuizQuestion[] = quiz.meta.questions.map((q) => ({
      ...q,
      attempted: answers[q.key] !== undefined,
      marked_answer: answers[q.key]?.toString(),
      marked: q.options[answers[q.key]] ?? "",
    }));

    return bffJson<IQuizSubmitResult>(`/api/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({
        quiz_id: quiz.id,
        course_id: courseId,
        quiz: { ...quiz, meta: { ...quiz.meta, questions: results } },
        results,
      }),
    });
  },

  // ─── Assignment ──────────────────────────────────────────────────────────
  async assignment(assignmentId: number, courseId: number): Promise<IAssignment> {
    return bffJson<IAssignment>(`/api/assignments/${assignmentId}/full?course_id=${courseId}`, {
      method: "GET",
    });
  },

  async startAssignment(assignmentId: number, courseId: number): Promise<unknown> {
    return bffJson(`/api/assignments/${assignmentId}/start`, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
    });
  },

  async uploadAssignment(
    assignmentId: number,
    files: File[],
    comment: string,
  ): Promise<{ attachment_urls?: { url: string; name: string }[] }> {
    const formData = new FormData();
    files.forEach((file, index) => formData.append(`files_${index}`, file));
    // WPLMS expects a single JSON `body` field; attachments array length drives
    // which $_FILES['files_{index}'] entries it reads.
    const wrappedComment = `<div class="vibe_editor_rich_text"><p>${comment}</p></div>`;
    formData.append(
      "body",
      JSON.stringify({ comment: wrappedComment, attachments: files.map(() => ({})) }),
    );

    const res = await fetch(`/api/assignments/${assignmentId}/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Upload failed");
    }
    return res.json();
  },

  // ─── Reviews (existing lms-backend endpoints) ─────────────────────────────
  async courseReviews(courseId: number): Promise<ICourseReview[]> {
    return bffJson<ICourseReview[]>(`/api/courses/${courseId}/reviews`, { method: "GET" });
  },

  async myReview(courseId: number): Promise<IMyReview> {
    return bffJson<IMyReview>(`/api/courses/${courseId}/reviews/mine`, { method: "GET" });
  },

  async submitReview(
    courseId: number,
    rating: number,
    review: string,
    title = "Course Review",
  ): Promise<unknown> {
    return bffJson(`/api/courses/${courseId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId, rating, content: review, title }),
    });
  },
};
