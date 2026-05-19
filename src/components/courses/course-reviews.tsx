"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import { Star } from "lucide-react";
import { useCourseReviews } from "@/lib/hooks/useCourses";
import { formatDate, truncate } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseReviewItem } from "@/types/course";

const INITIAL_SHOW = 6;

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`}
        />
      ))}
    </span>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-4 text-right text-xs text-neutral-600">{star}</span>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs text-neutral-500">{pct}%</span>
    </div>
  );
}

function ReviewCard({ review }: { review: CourseReviewItem }) {
  const [expanded, setExpanded] = useState(false);
  const words = review.content.split(/\s+/);
  const isLong = words.length > 16;
  const displayText = !isLong || expanded ? review.content : truncate(review.content.split(" ").slice(0, 16).join(" "), 120);

  return (
    <div className="rounded-lg border border-[#ebedf1] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-100">
          {isRenderableImageSrc(review.avatar) ? (
            <SafeImage src={review.avatar} alt={review.author} fill sizes="40px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-bold text-neutral-500">
              {review.author.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-semibold text-sm text-neutral-900">{review.author}</span>
            <span className="text-xs text-neutral-400">{formatDate(review.date)}</span>
          </div>
          <StarRating rating={review.rating} />
          {review.title ? (
            <p className="mt-1 text-sm font-medium text-neutral-800">{review.title}</p>
          ) : null}
          <p className="mt-1 text-sm text-neutral-600 leading-relaxed">
            {displayText}
            {isLong && !expanded ? "…" : ""}
          </p>
          {isLong ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-medium text-secondary-500 hover:underline"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface CourseReviewsProps {
  courseId: number | string;
}

export function CourseReviews({ courseId }: CourseReviewsProps) {
  const { data, isLoading } = useCourseReviews(courseId);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!data) return <p className="text-sm text-muted-foreground">Unable to load reviews.</p>;

  const { average_rating, total_reviews, rating_breakdown, reviews } = data;

  if (!total_reviews) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No reviews yet. Be the first to review this course.
      </p>
    );
  }

  const visible = showAll ? reviews : reviews.slice(0, INITIAL_SHOW);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-[#ebedf1] bg-white px-8 py-6 shadow-sm">
          <span className="text-5xl font-bold text-neutral-900">{average_rating.toFixed(1)}</span>
          <StarRating rating={average_rating} />
          <span className="text-xs text-neutral-500">{total_reviews.toLocaleString()} reviews</span>
        </div>
        <div className="flex-1 space-y-2 rounded-xl border border-[#ebedf1] bg-white p-5 shadow-sm">
          {([5, 4, 3, 2, 1] as const).map((star) => (
            <RatingBar
              key={star}
              star={star}
              count={rating_breakdown[String(star) as "1" | "2" | "3" | "4" | "5"] ?? 0}
              total={total_reviews}
            />
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {reviews.length > INITIAL_SHOW && !showAll ? (
        <div className="text-center">
          <button
            onClick={() => setShowAll(true)}
            className="rounded-full border border-secondary-500 px-6 py-2 text-sm font-medium text-secondary-500 transition-colors hover:bg-secondary-50"
          >
            Show all {total_reviews} reviews
          </button>
        </div>
      ) : null}
    </div>
  );
}
