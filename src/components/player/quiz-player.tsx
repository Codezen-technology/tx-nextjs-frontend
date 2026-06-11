"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { QuizStartPanel } from "@/components/player/quiz-start-panel";
import { QuizQuestionsPanel } from "@/components/player/quiz-questions-panel";
import { QuizResultsPanel } from "@/components/player/quiz-results-panel";
import { useQuiz, useRetakeQuiz, useStartQuiz, useSubmitQuiz } from "@/lib/hooks/usePlayer";
import { usePlayerStore } from "@/lib/stores/player.store";
import type { IQuizSubmitResult } from "@/types/player";

interface QuizPlayerProps {
  courseId: number;
  quizId: number;
  title: string;
  onContinue?: (unitId: number) => void;
}

type Phase = "start" | "questions" | "results";

export function QuizPlayer({ courseId, quizId, title, onContinue }: QuizPlayerProps) {
  const { data: quiz, isLoading } = useQuiz(courseId, quizId);
  const start = useStartQuiz(courseId);
  const submit = useSubmitQuiz(courseId);
  const retake = useRetakeQuiz(courseId);
  const key = `${courseId}-${quizId}`;
  const answers = usePlayerStore((s) => s.quizAnswers[key] ?? {});
  const setAnswer = usePlayerStore((s) => s.setQuizAnswer);
  const resetAnswers = usePlayerStore((s) => s.resetQuizAnswers);

  const [phase, setPhase] = useState<Phase>("start");
  const [result, setResult] = useState<IQuizSubmitResult | null>(null);

  useEffect(() => {
    if (quiz?.submitted) setPhase("results");
  }, [quiz?.submitted]);

  if (isLoading || !quiz) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 rounded-lg bg-white p-6 shadow-lg">
        <Skeleton className="h-8 w-1/2 bg-gray-200" />
        <Skeleton className="h-24 w-full bg-gray-200" />
      </div>
    );
  }

  if (quiz.drip_message) {
    return (
      <div className="rounded-md border border-amber-600 bg-amber-950 p-6 text-sm text-amber-200">
        {quiz.drip_message}
      </div>
    );
  }

  if (phase === "start") {
    return (
      <QuizStartPanel
        quiz={quiz}
        title={title}
        isStarting={start.isPending}
        onStart={() => {
          start.mutate(quizId);
          setPhase("questions");
        }}
      />
    );
  }

  if (phase === "results" && result) {
    return (
      <QuizResultsPanel
        result={result}
        isRetaking={retake.isPending}
        onContinue={onContinue}
        onRetake={() => {
          retake.mutate(quizId, {
            onSuccess: () => {
              resetAnswers(key);
              setResult(null);
              setPhase("start");
            },
          });
        }}
      />
    );
  }

  return (
    <QuizQuestionsPanel
      quiz={quiz}
      title={title}
      answers={answers}
      onAnswer={(qKey, optIdx) => setAnswer(key, qKey, optIdx)}
      isSubmitting={submit.isPending}
      onSubmit={() =>
        submit.mutate(
          { quizId, quiz, answers },
          {
            onSuccess: (res) => {
              setResult(res);
              setPhase("results");
            },
          },
        )
      }
    />
  );
}
