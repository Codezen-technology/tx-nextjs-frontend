import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";
import { ParsedHtml } from "@/components/ui/parsed-html";
import { PopularCoursesBlock } from "./popular-courses-block";
import { GravityFormLoader } from "@/components/forms/gravity-form-loader";
import type { PageBlock } from "@/types/page";

/**
 * Renders a landing page's ACF block list. Static blocks render server-side;
 * `popular_courses` is a client component that fetches its own data.
 */
export function BlockRenderer({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </>
  );
}

function Block({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "hero":
      return (
        <section className="relative overflow-hidden bg-neutral-900 py-16">
          {block.background && (
            <Image
              src={block.background}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-30"
            />
          )}
          <div className="relative container grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h1 className="font-suse text-3xl leading-tight font-bold text-white md:text-5xl">
                {block.title}
              </h1>
              {block.subtitle && (
                <p className="font-open-sans mt-4 max-w-xl text-lg text-white/80">
                  {block.subtitle}
                </p>
              )}
              {block.cta?.href && (
                <Link
                  href={block.cta.href}
                  className="bg-primary-500 font-open-sans hover:bg-primary-600 mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 font-semibold text-white transition-colors"
                >
                  {block.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            {block.image && (
              <div className="relative aspect-19/12 w-full overflow-hidden rounded-2xl bg-white/10">
                <Image
                  src={block.image}
                  alt={block.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </section>
      );

    case "rich_text":
      return (
        <section className="py-10">
          <div className="container">
            <ParsedHtml
              as="div"
              className="prose-wp font-open-sans mx-auto max-w-3xl text-neutral-500"
              content={block.content}
            />
          </div>
        </section>
      );

    case "popular_courses":
      return <PopularCoursesBlock block={block} />;

    case "membership":
      return (
        <section className="py-12">
          <div className="container">
            <div className="rounded-3xl bg-neutral-900 px-8 py-12 text-center">
              <h2 className="font-suse text-2xl font-bold text-white md:text-3xl">{block.title}</h2>
              {block.description && (
                <p className="font-open-sans mx-auto mt-3 max-w-2xl text-white/70">
                  {block.description}
                </p>
              )}
              <Link
                href="/pricing"
                className="bg-primary-500 font-open-sans hover:bg-primary-600 mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 font-semibold text-white transition-colors"
              >
                View Membership Plans <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      );

    case "testimonials":
      if (block.items.length === 0) return null;
      return (
        <section className="bg-[#f5f3ee] py-14">
          <div className="container">
            {block.title && (
              <h2 className="font-suse mb-8 text-center text-2xl font-bold text-neutral-900 md:text-3xl">
                {block.title}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {block.items.map((t) => (
                <figure key={t.id} className="rounded-2xl bg-white p-6 shadow-xs">
                  <Quote className="text-primary-400 h-6 w-6" />
                  <blockquote className="font-open-sans mt-3 text-sm text-neutral-500">
                    {t.text}
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    {t.photo && (
                      <Image
                        src={t.photo}
                        alt={t.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="font-suse text-sm font-bold text-neutral-900">{t.name}</div>
                      {t.designation && (
                        <div className="font-open-sans text-xs text-neutral-200">
                          {t.designation}
                        </div>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-0.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-open-sans text-xs text-neutral-500">
                        {t.rating.toFixed(1)}
                      </span>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      );

    case "sponsors":
      if (block.logos.length === 0) return null;
      return (
        <section className="py-12">
          <div className="container">
            {block.title && (
              <h2 className="font-suse mb-6 text-center text-xl font-bold text-neutral-900">
                {block.title}
              </h2>
            )}
            <div className="flex flex-wrap items-center justify-center gap-8">
              {block.logos.map((logo, i) => (
                <Image
                  key={i}
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={60}
                  className="h-12 w-auto min-w-12 object-contain opacity-80"
                />
              ))}
            </div>
          </div>
        </section>
      );

    case "faq":
      if (block.items.length === 0) return null;
      return (
        <section className="py-12">
          <div className="container max-w-3xl">
            {block.title && (
              <h2 className="font-suse mb-6 text-2xl font-bold text-neutral-900">{block.title}</h2>
            )}
            <div className="flex flex-col gap-3">
              {block.items.map((item, i) => (
                <details key={i} className="group border-neutral-30 rounded-xl border bg-white p-5">
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
          </div>
        </section>
      );

    case "cta_banner":
      return (
        <section className="py-12">
          <div className="container">
            <div className="bg-primary-500 flex flex-col items-center gap-6 overflow-hidden rounded-3xl px-8 py-12 text-center md:flex-row md:text-left">
              {block.image && (
                <Image
                  src={block.image}
                  alt={block.title}
                  width={160}
                  height={160}
                  className="h-32 w-32 shrink-0 object-contain"
                />
              )}
              <div className="flex-1">
                <h2 className="font-suse text-2xl font-bold text-white">{block.title}</h2>
                {block.text && <p className="font-open-sans mt-2 text-white/85">{block.text}</p>}
              </div>
              {block.button?.href && (
                <Link
                  href={block.button.href}
                  className="font-open-sans text-primary-600 hover:bg-neutral-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold transition-colors"
                >
                  {block.button.label} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      );

    case "gravity_form":
      return (
        <section className="py-12">
          <div className="container max-w-2xl">
            {block.title && (
              <h2 className="font-suse mb-6 text-2xl font-bold text-neutral-900">{block.title}</h2>
            )}
            <GravityFormLoader formId={block.form_id} />
          </div>
        </section>
      );

    default:
      return null;
  }
}
