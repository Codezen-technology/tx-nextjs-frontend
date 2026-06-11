import { create } from "zustand";
import type { QuizAnswers } from "@/types/player";

/**
 * Client-only UI state for the course player. Server data (course status, units,
 * quizzes, assignments) is owned by TanStack Query — this store holds only the
 * ephemeral interaction state the legacy @wordpress/data store used to carry:
 * the selected unit, in-progress quiz answers (keyed `{courseId}-{quizId}`), and
 * modal visibility.
 */
interface PlayerState {
  courseId: number | null;
  currentUnitId: number | null;
  /** Quiz answers keyed by `${courseId}-${quizId}` → { [questionKey]: optionIndex } */
  quizAnswers: Record<string, QuizAnswers>;
  reviewModalOpen: boolean;
  completionModalOpen: boolean;
  completionMessage: string | null;

  setCourse: (courseId: number) => void;
  setCurrentUnit: (unitId: number) => void;
  setQuizAnswer: (key: string, questionKey: string, optionIndex: number) => void;
  resetQuizAnswers: (key: string) => void;
  openReviewModal: () => void;
  closeReviewModal: () => void;
  openCompletionModal: (message?: string) => void;
  closeCompletionModal: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  courseId: null,
  currentUnitId: null,
  quizAnswers: {},
  reviewModalOpen: false,
  completionModalOpen: false,
  completionMessage: null,

  setCourse: (courseId) => set({ courseId }),
  setCurrentUnit: (unitId) => set({ currentUnitId: unitId }),
  setQuizAnswer: (key, questionKey, optionIndex) =>
    set((state) => ({
      quizAnswers: {
        ...state.quizAnswers,
        [key]: { ...(state.quizAnswers[key] ?? {}), [questionKey]: optionIndex },
      },
    })),
  resetQuizAnswers: (key) =>
    set((state) => {
      const next = { ...state.quizAnswers };
      delete next[key];
      return { quizAnswers: next };
    }),
  openReviewModal: () => set({ reviewModalOpen: true }),
  closeReviewModal: () => set({ reviewModalOpen: false }),
  openCompletionModal: (message) =>
    set({ completionModalOpen: true, completionMessage: message ?? null }),
  closeCompletionModal: () => set({ completionModalOpen: false }),
}));
