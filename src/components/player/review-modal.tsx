"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useSubmitReview } from "@/lib/hooks/usePlayer";
import { usePlayerStore } from "@/lib/stores/player.store";

export function ReviewModal({ courseId }: { courseId: number }) {
  const open = usePlayerStore((s) => s.reviewModalOpen);
  const close = usePlayerStore((s) => s.closeReviewModal);
  const submit = useSubmitReview(courseId);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [title, setTitle] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate this course</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hover || rating) >= n
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Review title"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          placeholder="Share your experience…"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={rating === 0 || submit.isPending}
            onClick={() => submit.mutate({ rating, review, title: title || "Course Review" })}
          >
            {submit.isPending ? <Loader2 className="animate-spin" /> : null}
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
