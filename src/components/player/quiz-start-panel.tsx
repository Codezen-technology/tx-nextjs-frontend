"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-2xl space-y-6 text-center text-white">
      <h1 className="text-2xl font-semibold">{quiz.title || title}</h1>
      {quiz.content ? (
        <ParsedHtml as="div" content={quiz.content} className="prose-wp prose-invert mx-auto" />
      ) : null}
      <dl className="mx-auto grid max-w-md grid-cols-2 gap-3 text-sm">
        <Stat label="Questions" value={String(questions.length)} />
        <Stat label="Total marks" value={String(quiz.meta?.max ?? 0)} />
        {quiz.meta?.duration ? <Stat label="Duration" value={`${quiz.meta.duration} min`} /> : null}
        {quiz.quiz_passing_score ? (
          <Stat label="Pass score" value={`${quiz.quiz_passing_score}%`} />
        ) : null}
      </dl>
      <Button size="lg" onClick={onStart} disabled={isStarting}>
        {isStarting ? <Loader2 className="animate-spin" /> : null}
        Start quiz
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-700 p-3">
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}
