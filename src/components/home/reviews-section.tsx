import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import type { HomeTestimonial } from "@/types/home";
import { cn } from "@/lib/utils/cn";

interface ReviewsSectionProps {
  testimonials?: HomeTestimonial[];
  title?: string;
  subtitle?: string;
  showViewAllLink?: boolean;
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
              ? "fill-green-500 text-green-500"
              : "fill-neutral-200 text-neutral-200",
          )}
        />
      ))}
    </span>
  );
}

function TrustpilotCard({ testimonials }: { testimonials: HomeTestimonial[] }) {
  const average = testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;

  return (
    <Link
      href="/reviews"
      className="border-neutral-30 flex flex-col justify-center gap-3 rounded-xl border bg-[#f0fbf1] p-6 transition-colors hover:bg-[#e5f8e6]"
    >
      <span className="font-suse flex items-center gap-1 text-lg font-bold text-neutral-900">
        <Star className="h-5 w-5 fill-[#00b67a] text-[#00b67a]" />
        Trustpilot
      </span>
      <StarRating rating={average} />
      <p className="font-open-sans text-sm font-semibold text-neutral-900">Excellent</p>
      <p className="font-open-sans text-xs text-neutral-500">
        Based on {testimonials.length}+ reviews
      </p>
    </Link>
  );
}

export function ReviewsSection({
  testimonials,
  title = "What Our Learners Have to Say",
  subtitle,
  showViewAllLink = true,
}: ReviewsSectionProps) {
  if (!testimonials?.length) return null;

  return (
    <section className="bg-primary-50 flex flex-col gap-4 py-16">
      <div className="container flex items-center justify-between">
        <div>
          <h2 className="font-suse text-3xl font-bold text-neutral-900 md:text-[2rem]">{title}</h2>
          {subtitle ? (
            <p className="font-open-sans mt-2 text-base text-neutral-500">{subtitle}</p>
          ) : null}
        </div>
        {showViewAllLink ? (
          <Link
            href="/reviews"
            className="font-open-sans text-secondary-500 hover:text-secondary-600 flex items-center gap-1 text-base font-normal transition-colors"
          >
            View all reviews
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="container mt-6 grid flex-1 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <TrustpilotCard testimonials={testimonials} />

        {testimonials.map((review) => (
          <div
            key={review.id}
            className="border-neutral-30 flex flex-col gap-4 rounded-xl border bg-white p-6"
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
                <p className="font-open-sans mb-1 text-xl font-semibold text-neutral-900">
                  {review.name}
                </p>
                {review.designation && (
                  <p className="font-open-sans mb-2 text-sm text-neutral-500">
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
