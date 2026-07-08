"use client";

import { Loader2 } from "lucide-react";
import { ParsedHtml } from "@/components/ui/parsed-html";
import type { IQuiz } from "@/types/player";

interface QuizStartPanelProps {
  quiz: IQuiz;
  title: string;
  onStart: () => void;
  isStarting: boolean;
}

export function QuizStartPanel({ quiz, title, onStart, isStarting }: QuizStartPanelProps) {
  const questions = quiz.meta?.questions ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-lg bg-white p-8 text-center text-gray-900 shadow-lg">
      <h1 className="text-2xl font-semibold">{quiz.title || title}</h1>
      {quiz.content ? (
        <ParsedHtml
          as="div"
          content={quiz.content}
          className="prose-wp mx-auto max-w-none text-left"
        />
      ) : null}
      <dl className="mx-auto grid max-w-md grid-cols-2 gap-3 text-sm">
        <Stat label="Questions" value={String(questions.length)} />
        <Stat label="Total marks" value={String(quiz.meta?.max ?? 0)} />
        {quiz.meta?.duration ? <Stat label="Duration" value={`${quiz.meta.duration} min`} /> : null}
        {quiz.quiz_passing_score ? (
          <Stat label="Pass score" value={`${quiz.quiz_passing_score}%`} />
        ) : null}
      </dl>
      <button
        type="button"
        onClick={onStart}
        disabled={isStarting}
        className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-6 py-3 text-base font-medium text-white shadow-xs transition-colors hover:bg-sky-600 disabled:opacity-50"
      >
        {isStarting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Start quiz
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-lg font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
