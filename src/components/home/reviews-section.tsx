import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import type { HomeTestimonial } from "@/types/home";
import fallbackReviews from "@/data/home/reviews.json";
import { cn } from "@/lib/utils/cn";

interface ReviewsSectionProps {
  testimonials?: HomeTestimonial[];
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-neutral-200 text-neutral-200",
          )}
        />
      ))}
    </span>
  );
}

function mapFallbackReview(
  review: (typeof fallbackReviews)[number],
  index: number,
): HomeTestimonial {
  return {
    id: index + 1,
    name: review.name,
    designation: null,
    rating: review.rating,
    text: review.text,
    photo: null,
  };
}

export function ReviewsSection({
  testimonials = fallbackReviews.map((review, index) => mapFallbackReview(review, index)),
}: ReviewsSectionProps) {
  if (!testimonials.length) return null;

  return (
    <section className="flex flex-col gap-4 bg-primary-50 py-16">
      <div className="container flex items-center justify-between">
        <h2 className="font-suse text-3xl font-bold text-neutral-900 md:text-[2rem]">
          What our learners have to say
        </h2>
        <Link
          href="/reviews"
          className="flex items-center gap-1 font-open-sans text-base font-normal text-secondary-500 transition-colors hover:text-secondary-600"
        >
          View all reviews
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="container mt-6 grid flex-1 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((review) => (
          <div
            key={review.id}
            className="flex flex-col gap-4 rounded-xl border border-neutral-30 bg-white p-6"
          >
            <div className="flex items-center gap-4">
              {review.photo ? (
                <img
                  src={review.photo}
                  alt={review.name}
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-900">
                  <span className="font-suse text-lg font-bold text-white">
                    {initialsFromName(review.name)}
                  </span>
                </div>
              )}
              <div>
                <p className="mb-1 font-open-sans text-xl font-semibold text-neutral-900">
                  {review.name}
                </p>
                {review.designation && (
                  <p className="mb-2 font-open-sans text-sm text-neutral-500">
                    {review.designation}
                  </p>
                )}
                <StarRating rating={review.rating} />
              </div>
            </div>
            <p className="font-open-sans text-sm leading-relaxed text-neutral-500">{review.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
