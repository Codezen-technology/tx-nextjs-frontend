"use client";

import { useState } from "react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBusinessReviewHas, useSubmitBusinessReview } from "@/lib/hooks/useBusinessDashboard";

export default function BusinessReviewsPage() {
  const { data: hasReview } = useBusinessReviewHas();
  const submitReview = useSubmitBusinessReview();
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitReview.mutateAsync({ rating, feedback });
    setSubmitted(true);
  };

  if (hasReview?.has_review || submitted) {
    return (
      <div className="space-y-6">
        <BusinessPageHeader title="Feedback" />
        <div className="border-neutral-30 rounded-xl border bg-white p-10 text-center shadow-xs">
          <p className="text-neutral-700">Thank you — your feedback has been recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BusinessPageHeader
        title="Share Your Feedback"
        description="Help us improve the business dashboard experience."
      />

      <form
        onSubmit={onSubmit}
        className="border-neutral-30 space-y-4 rounded-xl border bg-white p-6 shadow-xs"
      >
        <div>
          <label className="text-sm font-medium text-neutral-700">Rating (1–10)</label>
          <Input
            type="number"
            min={1}
            max={10}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="mt-1 w-24"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">Comments</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="border-neutral-40 mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <Button
          type="submit"
          className="bg-[#3F576F] hover:bg-[#33485d]"
          disabled={submitReview.isPending}
        >
          Submit feedback
        </Button>
      </form>
    </div>
  );
}
