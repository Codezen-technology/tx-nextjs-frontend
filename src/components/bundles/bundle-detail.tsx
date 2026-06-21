import Image from "next/image";
import { Award, BookOpen, Check, Clock, Layers, Star } from "lucide-react";
import { ParsedHtml } from "@/components/ui/parsed-html";
import { CourseCard } from "@/components/courses/course-card";
import { BundleAddToCart } from "./bundle-add-to-cart";
import type { BundleDetail } from "@/types/bundle";

function Section({ title, html }: { title?: string; html: string }) {
  if (!html) return null;
  return (
    <section className="mb-8">
      {title ? (
        <h2 className="mb-3 font-suse text-2xl font-bold text-neutral-900">{title}</h2>
      ) : null}
      <ParsedHtml as="div" className="prose-wp font-open-sans text-[#3b5374]" content={html} />
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
      <section className="relative overflow-hidden bg-[#00204a] py-10">
        <div className="container relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/20 px-3 py-1 text-sm font-semibold text-primary-400">
              <Layers className="h-3.5 w-3.5" /> Course Bundle
            </span>
            <h1 className="mt-4 font-suse text-3xl font-bold leading-tight text-white md:text-4xl">
              {bundle.title}
            </h1>
            {bundle.excerpt ? (
              <p className="mt-4 max-w-2xl font-open-sans text-white/70">{bundle.excerpt}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-5 font-open-sans text-sm text-white/80">
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
            <div className="relative aspect-[19/12] w-full overflow-hidden rounded-2xl bg-white/10">
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
              <div className="mb-8 rounded-2xl bg-primary-50 p-6">
                <ParsedHtml
                  as="div"
                  className="prose-wp font-open-sans text-[#3b5374]"
                  content={bundle.courseFor}
                />
              </div>
            ) : null}
            <Section html={bundle.content} />

            {/* Included courses */}
            {bundle.includedCourses.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-5 font-suse text-2xl font-bold text-neutral-900">
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
                  <div key={i} className="rounded-2xl bg-neutral-10 p-6">
                    <h3 className="font-suse text-lg font-bold text-neutral-900">{card.title}</h3>
                    <p className="mt-2 font-open-sans text-sm text-[#667992]">
                      {card.shortDescription}
                    </p>
                  </div>
                ))}
              </section>
            )}

            {/* FAQ */}
            {bundle.faq.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-5 font-suse text-2xl font-bold text-neutral-900">
                  Frequently asked questions
                </h2>
                <div className="flex flex-col gap-3">
                  {bundle.faq.map((item, i) => (
                    <details
                      key={i}
                      className="group rounded-xl border border-[#ebedf1] bg-white p-5"
                    >
                      <summary className="cursor-pointer font-suse font-semibold text-neutral-900">
                        {item.question}
                      </summary>
                      <ParsedHtml
                        as="div"
                        className="prose-wp mt-3 font-open-sans text-sm text-[#3b5374]"
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
            <div className="rounded-2xl border border-[#ebedf1] bg-white p-6 shadow-sm">
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

              {bundle.benefits.length > 0 && (
                <ul className="mt-6 flex flex-col gap-3">
                  {bundle.benefits.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 font-open-sans text-sm text-[#3b5374]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex items-center justify-between border-t border-[#ebedf1] pt-4 font-open-sans text-sm text-[#667992]">
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
