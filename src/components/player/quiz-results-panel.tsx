"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-2xl space-y-6 text-center text-white">
      {passed ? (
        <CheckCircle2 className="mx-auto h-16 w-16 text-player-success" />
      ) : (
        <XCircle className="mx-auto h-16 w-16 text-amber-500" />
      )}
      <h1 className="text-2xl font-semibold">{result.message}</h1>
      {result.completion_message ? (
        <ParsedHtml
          as="div"
          content={result.completion_message}
          className="prose-wp prose-invert mx-auto"
        />
      ) : null}
      <p className="text-sm text-gray-400">Course progress: {result.progress}%</p>
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
          <Button
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-900"
            onClick={onRetake}
            disabled={isRetaking}
          >
            Retake ({result.retakes} left)
          </Button>
        ) : null}
        {result.next_unit && onContinue ? (
          <Button
            className="bg-player-primary hover:bg-sky-600"
            onClick={() => onContinue(result.next_unit as number)}
          >
            Continue to next unit
          </Button>
        ) : null}
      </div>
    </div>
  );
}
