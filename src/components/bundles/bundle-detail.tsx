import Image from "next/image";
import { Award, BookOpen, Check, Clock, Layers, Star } from "lucide-react";
import { ParsedHtml } from "@/components/ui/parsed-html";
import { CourseCard } from "@/components/courses/course-card";
import { BundleAddToCart } from "./bundle-add-to-cart";
import { BulkDiscountTable } from "@/components/courses/bulk-discount-table";
import type { BundleDetail } from "@/types/bundle";

function Section({ title, html }: { title?: string; html: string }) {
  if (!html) return null;
  return (
    <section className="mb-8">
      {title ? (
        <h2 className="font-suse mb-3 text-2xl font-bold text-neutral-900">{title}</h2>
      ) : null}
      <ParsedHtml as="div" className="prose-wp font-open-sans text-neutral-500" content={html} />
    </section>
  );
}

export function BundleDetail({ bundle }: { bundle: BundleDetail }) {
  const { pricing } = bundle;
  const showStrike =
    pricing.regularPrice != null && pricing.price != null && pricing.regularPrice > pricing.price;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-900 py-10">
        <div className="relative container grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <span className="bg-primary-500/20 text-primary-400 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold">
              <Layers className="h-3.5 w-3.5" /> Course Bundle
            </span>
            <h1 className="font-suse mt-4 text-3xl leading-tight font-bold text-white md:text-4xl">
              {bundle.title}
            </h1>
            {bundle.excerpt ? (
              <p className="font-open-sans mt-4 max-w-2xl text-white/70">{bundle.excerpt}</p>
            ) : null}
            <div className="font-open-sans mt-5 flex flex-wrap items-center gap-5 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-4 w-4" /> {bundle.includedCoursesCount} courses
              </span>
              {bundle.totalDurationHours > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {bundle.totalDurationHours} hours
                </span>
              )}
              {bundle.cpdPoints > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Award className="h-4 w-4" /> {bundle.cpdPoints} CPD points
                </span>
              )}
              {bundle.rating.count > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {bundle.rating.average.toFixed(1)} ({bundle.rating.count})
                </span>
              )}
            </div>
          </div>
          {(bundle.image?.large || bundle.image?.full) && (
            <div className="relative aspect-19/12 w-full overflow-hidden rounded-2xl bg-white/10">
              <Image
                src={(bundle.image.large ?? bundle.image.full) as string}
                alt={bundle.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <div className="py-12">
        <div className="container grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div className="min-w-0">
            <Section html={bundle.standards ?? ""} />
            <Section title="Objectives" html={bundle.objectives ?? ""} />
            {bundle.courseFor ? (
              <div className="bg-primary-50 mb-8 rounded-2xl p-6">
                <ParsedHtml
                  as="div"
                  className="prose-wp font-open-sans text-neutral-500"
                  content={bundle.courseFor}
                />
              </div>
            ) : null}
            <Section html={bundle.content} />

            {/* Included courses */}
            {bundle.includedCourses.length > 0 && (
              <section className="mb-10">
                <h2 className="font-suse mb-5 text-2xl font-bold text-neutral-900">
                  Courses in this bundle
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {bundle.includedCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}

            {/* Included course cards (ACF marketing copy) */}
            {bundle.includedCoursesCards.length > 0 && (
              <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {bundle.includedCoursesCards.map((card, i) => (
                  <div key={i} className="bg-neutral-10 rounded-2xl p-6">
                    <h3 className="font-suse text-lg font-bold text-neutral-900">{card.title}</h3>
                    <p className="font-open-sans mt-2 text-sm text-neutral-200">
                      {card.shortDescription}
                    </p>
                  </div>
                ))}
              </section>
            )}

            {/* FAQ */}
            {bundle.faq.length > 0 && (
              <section className="mb-6">
                <h2 className="font-suse mb-5 text-2xl font-bold text-neutral-900">
                  Frequently asked questions
                </h2>
                <div className="flex flex-col gap-3">
                  {bundle.faq.map((item, i) => (
                    <details
                      key={i}
                      className="group border-neutral-30 rounded-xl border bg-white p-5"
                    >
                      <summary className="font-suse cursor-pointer font-semibold text-neutral-900">
                        {item.question}
                      </summary>
                      <ParsedHtml
                        as="div"
                        className="prose-wp font-open-sans mt-3 text-sm text-neutral-500"
                        content={item.answer}
                      />
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24">
            <div className="border-neutral-30 rounded-2xl border bg-white p-6 shadow-xs">
              <div className="flex items-baseline gap-3">
                {pricing.price != null && (
                  <span className="font-open-sans text-3xl font-bold text-neutral-900">
                    £{pricing.price}
                  </span>
                )}
                {showStrike && (
                  <span className="font-open-sans text-lg text-[#dc3545] line-through">
                    £{pricing.regularPrice}
                  </span>
                )}
              </div>

              <div className="mt-5">
                <BundleAddToCart productId={bundle.id} />
              </div>

              {pricing.price != null && (
                <div className="mt-5">
                  <p className="font-suse mb-2 text-sm font-semibold text-neutral-700">
                    Buying for a team?
                  </p>
                  <BulkDiscountTable unitPrice={pricing.price} currency="£" />
                </div>
              )}

              {bundle.benefits.length > 0 && (
                <ul className="mt-6 flex flex-col gap-3">
                  {bundle.benefits.map((b, i) => (
                    <li
                      key={i}
                      className="font-open-sans flex items-start gap-2 text-sm text-neutral-500"
                    >
                      <Check className="text-primary-500 mt-0.5 h-4 w-4 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-neutral-30 font-open-sans mt-6 flex items-center justify-between border-t pt-4 text-sm text-neutral-200">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> {bundle.includedCoursesCount} courses
                </span>
                {bundle.cpdPoints > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="h-4 w-4" /> {bundle.cpdPoints} CPD
                  </span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
