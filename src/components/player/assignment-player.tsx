"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ParsedHtml } from "@/components/ui/parsed-html";
import { AssignmentCountdown } from "@/components/player/assignment-countdown";
import { useAssignment, useStartAssignment, useUploadAssignment } from "@/lib/hooks/usePlayer";
import { toast } from "sonner";
import type { IAssignment } from "@/types/player";

interface AssignmentPlayerProps {
  courseId: number;
  assignmentId: number;
  title: string;
}

function validateFiles(files: File[], assignment: IAssignment): string | null {
  const maxBytes = assignment.permit_size || 0;
  const allowedExt = assignment.permit_extension ?? [];
  const allowedMime = assignment.permit_mime ?? [];

  for (const file of files) {
    if (maxBytes > 0 && file.size > maxBytes) {
      return `"${file.name}" exceeds the maximum file size.`;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (allowedExt.length && ext && !allowedExt.map((e) => e.toLowerCase()).includes(ext)) {
      return `"${file.name}" has a disallowed file type.`;
    }
    if (allowedMime.length && !allowedMime.includes(file.type)) {
      return `"${file.name}" has a disallowed MIME type.`;
    }
  }
  return null;
}

export function AssignmentPlayer({ courseId, assignmentId, title }: AssignmentPlayerProps) {
  const { data: assignment, isLoading, refetch } = useAssignment(courseId, assignmentId);
  const start = useStartAssignment(courseId);
  const upload = useUploadAssignment(courseId);
  const fileInput = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [comment, setComment] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [urlAnswer, setUrlAnswer] = useState("");
  const [started, setStarted] = useState(false);

  if (isLoading || !assignment) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2 bg-gray-800" />
        <Skeleton className="h-32 w-full bg-gray-800" />
      </div>
    );
  }

  const needsStart = assignment.flag === 0 && !assignment.start && !started;
  const submitted = assignment.already_submitted === 1;
  const canResubmit = (assignment.remaining ?? 0) > 0;
  const maxSizeMb = assignment.permit_size
    ? Math.round(assignment.permit_size / 1024 / 1024)
    : null;
  const assignmentType = assignment.type ?? "upload";

  const handleStart = () => {
    start.mutate(assignmentId, {
      onSuccess: () => {
        setStarted(true);
        void refetch();
      },
    });
  };

  const onPick = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files, ...Array.from(picked)];
    const err = validateFiles(next, assignment);
    if (err) {
      toast.error(err);
      return;
    }
    setFiles(next);
  };

  const buildComment = () => {
    if (assignmentType === "text") return textAnswer;
    if (assignmentType === "url") return urlAnswer;
    return comment;
  };

  const canSubmit = () => {
    if (assignmentType === "text") return textAnswer.trim().length > 0;
    if (assignmentType === "url") return urlAnswer.trim().length > 0;
    return files.length > 0;
  };

  if (needsStart) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center text-white">
        <h1 className="text-2xl font-semibold">{assignment.title || title}</h1>
        <p className="text-gray-400">Click below to start this assignment.</p>
        <Button size="lg" onClick={handleStart} disabled={start.isPending}>
          {start.isPending ? <Loader2 className="animate-spin" /> : null}
          Start Assignment
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-white">
      <h1 className="text-2xl font-semibold">{assignment.title || title}</h1>

      {assignment.remaining ? (
        <AssignmentCountdown remainingSeconds={assignment.remaining} />
      ) : null}

      {assignment.content ? (
        <ParsedHtml as="div" content={assignment.content} className="prose-wp prose-invert" />
      ) : null}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Total marks" value={String(assignment.total_marks ?? 0)} />
        {assignment.duration ? (
          <Stat label="Duration" value={`${assignment.duration} min`} />
        ) : null}
      </dl>

      {submitted && !canResubmit ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-700 bg-emerald-950 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="h-5 w-5" /> Assignment submitted. Awaiting evaluation.
        </div>
      ) : (
        <div className="space-y-4">
          {assignmentType === "text" ? (
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              rows={8}
              placeholder="Enter your answer…"
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
            />
          ) : assignmentType === "url" ? (
            <input
              type="url"
              value={urlAnswer}
              onChange={(e) => setUrlAnswer(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
            />
          ) : (
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onPick(e.dataTransfer.files);
                }}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-600 p-8 text-center text-sm text-gray-400 transition-colors hover:border-player-primary hover:bg-gray-900"
              >
                <Upload className="h-6 w-6" />
                <span>Drop files or click to upload</span>
                {assignment.permit_extension?.length ? (
                  <span className="text-xs">
                    {assignment.permit_extension.join(", ")}
                    {maxSizeMb ? ` · up to ${maxSizeMb}MB` : ""}
                  </span>
                ) : null}
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept={assignment.permit_mime?.join(",")}
                  className="hidden"
                  onChange={(e) => onPick(e.target.files)}
                />
              </div>

              {files.length ? (
                <ul className="space-y-2">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-gray-700 px-3 py-2 text-sm"
                    >
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Add a comment (optional)"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              />
            </>
          )}

          <div className="flex justify-end">
            <Button
              size="lg"
              className="bg-player-primary hover:bg-sky-600"
              disabled={!canSubmit() || upload.isPending}
              onClick={() => {
                const body = buildComment();
                if (assignmentType === "upload") {
                  upload.mutate(
                    { assignmentId, files, comment: body },
                    {
                      onSuccess: () => {
                        setFiles([]);
                        setComment("");
                        void refetch();
                      },
                    },
                  );
                } else {
                  const blob = new Blob([body], { type: "text/plain" });
                  const file = new File([blob], "answer.txt", { type: "text/plain" });
                  upload.mutate(
                    { assignmentId, files: [file], comment: body },
                    {
                      onSuccess: () => {
                        setTextAnswer("");
                        setUrlAnswer("");
                        void refetch();
                      },
                    },
                  );
                }
              }}
            >
              {upload.isPending ? <Loader2 className="animate-spin" /> : null}
              {submitted ? "Re-submit assignment" : "Submit assignment"}
            </Button>
          </div>
        </div>
      )}
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
