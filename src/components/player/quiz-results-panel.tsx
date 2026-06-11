"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { ParsedHtml } from "@/components/ui/parsed-html";
import type { IQuizSubmitResult } from "@/types/player";

interface QuizResultsPanelProps {
  result: IQuizSubmitResult;
  onRetake?: () => void;
  onContinue?: (unitId: number) => void;
  isRetaking?: boolean;
}

export function QuizResultsPanel({
  result,
  onRetake,
  onContinue,
  isRetaking,
}: QuizResultsPanelProps) {
  const passed = result.continue === 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-lg bg-white p-8 text-center text-gray-900 shadow-lg">
      {passed ? (
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
      ) : (
        <XCircle className="mx-auto h-16 w-16 text-amber-500" />
      )}
      <h1 className="text-2xl font-semibold">{result.message}</h1>
      {result.completion_message ? (
        <ParsedHtml
          as="div"
          content={result.completion_message}
          className="prose-wp mx-auto max-w-none text-left"
        />
      ) : null}
      <p className="text-sm text-gray-500">Course progress: {result.progress}%</p>
      {result.tags_data?.length ? (
        <ul className="mx-auto max-w-md space-y-2 text-left text-sm">
          {result.tags_data.map((t) => (
            <li key={t.label} className="flex items-center justify-between gap-3">
              <span>{t.label}</span>
              <span className="font-medium">{t.value}%</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap justify-center gap-3">
        {result.retakes > 0 && onRetake ? (
          <button
            type="button"
            onClick={onRetake}
            disabled={isRetaking}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            Retake ({result.retakes} left)
          </button>
        ) : null}
        {result.next_unit && onContinue ? (
          <button
            type="button"
            onClick={() => onContinue(result.next_unit as number)}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600"
          >
            Continue to next unit
          </button>
        ) : null}
      </div>
    </div>
  );
}
