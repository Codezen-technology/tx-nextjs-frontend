"use client";

import { memo, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { findVimeoIframe } from "@/lib/player/vimeo-ended";
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

  onVideoEndedRef.current = onVideoEnded;

  const htmlBody = content?.content?.trim();
  const videoEmbed = content?.meta?.video?.trim();
  const displayHtml = htmlBody || videoEmbed;

  useEffect(() => {
    if (isLoading || !displayHtml || !canAutoComplete) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const tryBind = async (): Promise<boolean> => {
      const container = containerRef.current;
      if (cancelled || !container) return false;

      const iframe = findVimeoIframe(container);
      if (iframe) {
        const { bindVimeoEnded } = await import("@/lib/player/vimeo-ended");
        if (cancelled) return true;
        cleanup?.();
        cleanup = bindVimeoEnded(iframe, () => onVideoEndedRef.current(unitId));
        return true;
      }

      const video = container.querySelector<HTMLVideoElement>("video");
      if (video) {
        const handler = () => onVideoEndedRef.current(unitId);
        cleanup?.();
        video.addEventListener("ended", handler);
        cleanup = () => video.removeEventListener("ended", handler);
        return true;
      }

      return false;
    };

    const scheduleRetries = () => {
      void tryBind().then((bound) => {
        if (bound || cancelled) return;
        timers.push(setTimeout(() => void tryBind(), 400));
        timers.push(setTimeout(() => void tryBind(), 1200));
      });
    };

    requestAnimationFrame(scheduleRetries);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      cleanup?.();
    };
  }, [isLoading, displayHtml, canAutoComplete, unitId]);

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
