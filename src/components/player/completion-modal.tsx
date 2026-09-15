"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ParsedHtml } from "@/components/ui/parsed-html";
import { usePlayerStore } from "@/lib/stores/player.store";

/** Congratulations modal — parity with WP CongratulationsModal. */
export function CompletionModal({ courseId: _courseId }: { courseId: number }) {
  const open = usePlayerStore((s) => s.completionModalOpen);
  const message = usePlayerStore((s) => s.completionMessage);
  const close = usePlayerStore((s) => s.closeCompletionModal);
  const openReview = usePlayerStore((s) => s.openReviewModal);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-(--breakpoint-sm) overflow-hidden border-0 p-0">
        <div className="relative px-8 py-12 text-center">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-linear-to-br from-[#EBEDF1] to-[#004F65] opacity-40" />

          <GraduationCap className="mx-auto mb-4 h-16 w-16 text-[#01BBF0]" />

          <h2 className="font-suse mb-4 text-xl font-extrabold tracking-wider text-[#16d5cb] uppercase sm:text-[32px]">
            Congratulations!
          </h2>

          {message ? (
            <ParsedHtml as="div" content={message} className="prose-wp mx-auto mb-4 text-sm" />
          ) : (
            <p className="font-open-sans mb-4 px-4 text-base leading-snug font-medium text-gray-300">
              We know it was hard but you have successfully completed the course!
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              onClick={() => {
                close();
                openReview();
              }}
            >
              Leave a review
            </Button>
            <Link
              href="/certificate"
              className="flex items-center justify-center rounded-lg bg-[#3f4d97] px-3 text-center text-base font-medium text-white shadow-[0px_4px_10px_0px_rgba(63,77,151,0.3)] transition-opacity hover:opacity-90"
            >
              Order your certificate
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
