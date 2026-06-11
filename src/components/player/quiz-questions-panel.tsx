"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
    <div className="mx-auto w-full max-w-4xl rounded-lg bg-white text-gray-900 shadow-lg">
      <header className="border-b border-gray-200 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="truncate text-base font-semibold sm:text-lg">{quiz.title || title}</h1>
          {quiz.remaining ? (
            <span
              className={cn(
                "shrink-0 rounded px-2 py-0.5 font-mono text-xs sm:text-sm",
                remaining < 60 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700",
              )}
            >
              {formatTime(remaining)}
            </span>
          ) : null}
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-sky-500 transition-all"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Question {currentIdx + 1} of {questions.length} · {answeredCount}/{questions.length}{" "}
          answered
        </p>
      </header>

      {/* Question + options — natural height, no inner scroll */}
      <section className="px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex gap-2 text-sm font-medium leading-snug text-gray-900 sm:text-base">
          <span className="shrink-0 text-gray-500">{currentIdx + 1}.</span>
          <ParsedHtml
            as="div"
            content={current.content}
            className="prose-wp prose-sm prose-p:my-0 prose-headings:my-0 max-w-none"
          />
        </div>

        <ul className="mt-3 space-y-2 sm:mt-4">
          {current.options.map((opt, optIdx) => {
            const selected = answers[current.key] === optIdx;
            return (
              <li key={optIdx}>
                <button
                  type="button"
                  onClick={() => onAnswer(current.key, optIdx)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-md border px-3 py-2 text-left text-sm leading-snug transition-colors sm:gap-3 sm:px-3.5 sm:py-2.5",
                    selected
                      ? "border-sky-500 bg-sky-500 text-white"
                      : "border-gray-300 bg-gray-50 text-gray-800 hover:border-gray-400 hover:bg-gray-100",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border sm:h-[18px] sm:w-[18px]",
                      selected ? "border-white bg-white/20" : "border-gray-400 bg-white",
                    )}
                  >
                    {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                  </span>
                  <span
                    className={cn("min-w-0 flex-1", selected && "text-white")}
                    dangerouslySetInnerHTML={{ __html: opt }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="border-t border-gray-200 px-4 py-3 sm:px-5">
        <div
          className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1"
          aria-label="Jump to question"
        >
          {questions.map((q, idx) => (
            <button
              key={q.key}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-semibold transition-colors",
                idx === currentIdx
                  ? "bg-sky-500 text-white ring-2 ring-sky-500 ring-offset-1"
                  : answers[q.key] !== undefined
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => i - 1)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:py-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => i + 1)}
              className="inline-flex items-center gap-1 rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-600 sm:px-4 sm:py-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!allAnswered || isSubmitting}
              onClick={onSubmit}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:py-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit quiz
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
