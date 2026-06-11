"use client";

import { memo, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { bindVimeoEnded } from "@/lib/player/vimeo-ended";
import { useUnitContent } from "@/lib/hooks/usePlayer";

interface UnitContentDisplayProps {
  courseId: number;
  unitId: number;
  unitTitle: string;
  canAutoComplete: boolean;
  onVideoEnded: (unitId: number) => void;
}

function UnitContentDisplayInner({
  courseId,
  unitId,
  unitTitle,
  canAutoComplete,
  onVideoEnded,
}: UnitContentDisplayProps) {
  const { data: content, isLoading } = useUnitContent(courseId, unitId);
  const containerRef = useRef<HTMLDivElement>(null);
  const onVideoEndedRef = useRef(onVideoEnded);
  const boundKeyRef = useRef<string | null>(null);

  onVideoEndedRef.current = onVideoEnded;

  const htmlBody = content?.content?.trim();
  const videoEmbed = content?.meta?.video?.trim();
  const displayHtml = htmlBody || videoEmbed;
  const bindKey = displayHtml ? `${courseId}-${unitId}` : null;

  useEffect(() => {
    if (!bindKey || !containerRef.current || !canAutoComplete) return;
    if (boundKeyRef.current === bindKey) return;

    const container = containerRef.current;
    const iframe =
      container.querySelector<HTMLIFrameElement>('iframe[src*="vimeo"]') ??
      Array.from(container.querySelectorAll<HTMLIFrameElement>("iframe")).find((el) =>
        el.src.includes("vimeo.com"),
      );

    if (iframe) {
      boundKeyRef.current = bindKey;
      return bindVimeoEnded(iframe, () => onVideoEndedRef.current(unitId));
    }

    const video = container.querySelector<HTMLVideoElement>("video");
    if (video) {
      boundKeyRef.current = bindKey;
      const handler = () => onVideoEndedRef.current(unitId);
      video.addEventListener("ended", handler);
      return () => {
        video.removeEventListener("ended", handler);
        if (boundKeyRef.current === bindKey) boundKeyRef.current = null;
      };
    }

    return undefined;
  }, [bindKey, canAutoComplete, courseId, unitId]);

  useEffect(() => {
    boundKeyRef.current = null;
  }, [bindKey]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Skeleton className="h-full min-h-[50vh] w-full bg-gray-900" />
      </div>
    );
  }

  const attachments = content?.meta?.attachments ?? [];

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col bg-black">
      <header className="shrink-0 border-b border-gray-900 px-4 py-3 sm:px-6">
        <h1 className="text-lg font-semibold text-white sm:text-xl">
          {content?.title ?? unitTitle}
        </h1>
      </header>

      {displayHtml ? (
        <div
          ref={containerRef}
          className="unit-course-player min-h-0 flex-1 overflow-y-auto bg-black"
          dangerouslySetInnerHTML={{ __html: displayHtml }}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-gray-400">
          No content available for this unit.
        </div>
      )}

      {attachments.length ? (
        <section className="shrink-0 border-t border-gray-800 px-4 py-4 sm:px-6">
          <h2 className="mb-2 text-sm font-semibold text-white">Attachments</h2>
          <ul className="space-y-1 text-sm">
            {attachments.map((a, i) => (
              <li key={i}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline"
                >
                  {a.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export const UnitContentDisplay = memo(UnitContentDisplayInner);
