import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { serverApi, type ApiReview } from "@/lib/api/server";
import { decodeEntities } from "@/lib/api/parsers";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLinks } from "@/components/ui/page-links";

const REVIEWS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Course Reviews | Training Excellence",
  description: "Genuine reviews from Training Excellence learners across the UK.",
  url: `${env.SITE_URL.replace(/\/$/, "")}/reviews`,
};

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/reviews");
  return buildPageMetadata(seo, {
    title: "Course Reviews | Training Excellence",
    description:
      "What do learners say about our courses? Read genuine reviews from Training Excellence students across the UK.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/reviews`,
  });
}

export const revalidate = 300;

const PER_PAGE = 12;

interface ReviewsPageProps {
  searchParams: Promise<{ page?: string }>;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={
            i < rating
              ? "h-4 w-4 fill-secondary-500 text-secondary-500"
              : "h-4 w-4 text-neutral-300"
          }
        />
      ))}
    </span>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function ReviewCard({ review }: { review: ApiReview }) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-[#ebedf1] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {review.author.avatar ? (
          <Image
            src={review.author.avatar}
            alt={review.author.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 font-suse font-bold text-secondary-500">
            {review.author.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-open-sans text-sm font-semibold text-neutral-900">
            {review.author.name}
          </p>
          <p className="font-open-sans text-xs text-neutral-400">{formatDate(review.created_at)}</p>
        </div>
      </div>
      <Stars rating={review.rating} />
      {review.title && (
        <h3 className="font-suse font-bold leading-snug text-neutral-900">
          {decodeEntities(review.title)}
        </h3>
      )}
      <p className="line-clamp-6 font-open-sans text-sm leading-relaxed text-neutral-600">
        {decodeEntities(review.content).replace(/<[^>]+>/g, "")}
      </p>
    </article>
  );
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);
  const result = await serverApi.reviews.list({ page, per_page: PER_PAGE }).catch(() => null);

  const reviews = result?.items ?? [];
  const totalPages = result?.totalPages ?? 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(REVIEWS_SCHEMA) }}
      />
      <section className="bg-primary-50 py-14 text-center">
        <div className="container">
          <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-secondary-500">
            Testimonials
          </p>
          <h1 className="mt-2 font-suse text-4xl font-bold text-neutral-900">
            What do Learners Say About Our Courses?
          </h1>
          <p className="mx-auto mt-3 max-w-2xl font-open-sans text-neutral-500">
            Genuine reviews from our learners — see how Training Excellence courses help people get
            skilled and get certified.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          {reviews.length ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
              <PageLinks
                page={page}
                totalPages={totalPages}
                hrefFor={(p) => (p <= 1 ? "/reviews" : `/reviews?page=${p}`)}
              />
            </>
          ) : (
            <EmptyState
              title="No reviews yet"
              description="Be the first to share your experience."
              action={
                <Link
                  href="/all-courses"
                  className="font-open-sans text-sm font-semibold text-secondary-500 hover:text-secondary-600"
                >
                  Browse courses →
                </Link>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
