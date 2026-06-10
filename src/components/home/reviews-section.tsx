import Link from "next/link";
import { ChevronRight } from "lucide-react";
import reviewsData from "@/data/home/reviews.json";

export function ReviewsSection() {
  if (!reviewsData?.length) return null;

  return (
    <section className="bg-primary-50 py-16 flex flex-col gap-4">
      <div className="flex items-center justify-between container">
        <h2 className="font-suse text-3xl font-bold text-neutral-900 md:text-[2rem]">
          What our learners have to say
        </h2>
        <Link
          href="/all-reviews"
          className="flex items-center gap-1 font-open-sans text-base font-normal text-secondary-500 transition-colors hover:text-secondary-600"
        >
          View all reviews
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 container mt-6">
        {reviewsData.map((review) => (
          <div
            key={review.name}
            className="flex flex-col gap-4 rounded-xl border border-neutral-30 bg-white p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-900">
                <span className="font-suse text-lg font-bold text-white">
                  {review.initials}
                </span>
              </div>
              <div>
                <p className="font-open-sans text-xl font-semibold text-neutral-900 mb-2">
                  {review.name}
                </p>
                <img
                  src={review.ratingImage}
                  alt={`Rating for ${review.name}`}
                  className="h-4 w-auto"
                />
              </div>
            </div>
            <p className="font-open-sans text-sm leading-relaxed text-neutral-500">
              {review.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}