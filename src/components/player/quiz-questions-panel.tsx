"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParsedHtml } from "@/components/ui/parsed-html";
import { cn } from "@/lib/utils/cn";
import type { IQuiz, IQuizQuestion } from "@/types/player";
import type { QuizAnswers } from "@/types/player";

interface QuizQuestionsPanelProps {
  quiz: IQuiz;
  title: string;
  answers: QuizAnswers;
  onAnswer: (questionKey: string, optionIndex: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuizQuestionsPanel({
  quiz,
  title,
  answers,
  onAnswer,
  onSubmit,
  isSubmitting,
}: QuizQuestionsPanelProps) {
  const questions = quiz.meta?.questions ?? [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [remaining, setRemaining] = useState(quiz.remaining ?? 0);

  useEffect(() => {
    if (!quiz.remaining) return;
    setRemaining(quiz.remaining);
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quiz.remaining]);

  const current = questions[currentIdx] as IQuizQuestion | undefined;
  const allAnswered = questions.every((q) => answers[q.key] !== undefined);
  const answeredCount = questions.filter((q) => answers[q.key] !== undefined).length;

  if (!current) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col text-white">
      <div className="sticky top-0 z-10 mb-4 border-b border-gray-800 bg-black/95 pb-4">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h1 className="truncate text-lg font-semibold">{quiz.title || title}</h1>
          {quiz.remaining ? (
            <span
              className={cn(
                "shrink-0 rounded-md px-3 py-1 font-mono text-sm",
                remaining < 60 ? "bg-red-900 text-red-200" : "bg-gray-800",
              )}
            >
              {formatTime(remaining)}
            </span>
          ) : null}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full bg-player-primary transition-all"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {answeredCount}/{questions.length} answered
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-gray-800 p-6">
        <div className="mb-4 flex gap-2 text-sm font-medium">
          <span className="text-gray-400">{currentIdx + 1}.</span>
          <ParsedHtml
            as="div"
            content={current.content}
            className="prose-wp prose-invert prose-sm"
          />
        </div>
        <div className="space-y-2">
          {current.options.map((opt, optIdx) => {
            const selected = answers[current.key] === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => onAnswer(current.key, optIdx)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md border border-gray-700 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-900",
                  selected && "border-player-primary bg-player-primary/10 font-medium",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    selected && "border-player-primary bg-player-primary",
                  )}
                >
                  {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
                <span dangerouslySetInnerHTML={{ __html: opt }} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={q.key}
            type="button"
            onClick={() => setCurrentIdx(idx)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded text-xs font-medium",
              idx === currentIdx && "ring-2 ring-player-primary",
              answers[q.key] !== undefined
                ? "bg-player-success text-white"
                : "bg-gray-800 text-gray-400",
            )}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pb-8">
        <Button
          variant="outline"
          className="border-gray-700 bg-transparent text-white hover:bg-gray-900"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        {currentIdx < questions.length - 1 ? (
          <Button
            className="bg-player-primary hover:bg-sky-600"
            onClick={() => setCurrentIdx((i) => i + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="bg-player-success hover:bg-green-600"
            disabled={!allAnswered || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Submit quiz
          </Button>
        )}
      </div>
    </div>
  );
}
