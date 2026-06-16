"use client";

import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
      <DialogContent className="max-w-screen-sm overflow-hidden border-0 p-0">
        <div className="relative px-8 py-12 text-center">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-50 opacity-40" />

          <PartyPopper className="mx-auto mb-4 h-16 w-16 text-[#EE3C7A]" />

          <h2
            className="mb-4 text-xl font-extrabold uppercase tracking-wider sm:text-[48px]"
            style={{ color: "#EE3C7A" }}
          >
            Congratulations!
          </h2>

          {message ? (
            <ParsedHtml as="div" content={message} className="prose-wp mx-auto mb-4 text-sm" />
          ) : (
            <p className="mb-4 text-xl font-bold leading-snug text-[#2E4450] sm:text-2xl">
              We know it was hard but you have successfully completed the course!
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                close();
                openReview();
              }}
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Leave a review
            </button>
            <Link
              href="/certificate"
              className="rounded-lg px-6 py-4 text-center text-lg font-semibold text-white transition-opacity hover:opacity-90 sm:text-2xl"
              style={{
                backgroundColor: "#3F4D97",
                boxShadow: "0px 4px 10px 0px rgba(63, 77, 151, 0.3)",
              }}
            >
              Order your certificate
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
