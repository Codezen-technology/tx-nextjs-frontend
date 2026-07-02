import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { fetchCancellationsPage } from "@/lib/services/cancellations.server";
import { fetchForm } from "@/lib/services/forms.server";
import { ReviewsSection } from "@/components/home/reviews-section";
import { IssueTypePicker } from "@/components/cancellations/issue-type-picker";
import { RefundRequestForm } from "@/components/cancellations/refund-request-form";
import { SupportSidebar } from "@/components/cancellations/support-sidebar";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/cancellations");
  return buildPageMetadata(seo, {
    title: "Cancellations & Refunds | Training Excellence",
    description:
      "Need to cancel or request a refund? Start with quick support for access, billing, or course issues — or submit a refund request when that is the right next step.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/cancellations`,
  });
}

export default async function CancellationsPage() {
  setRequestLocale(await getLocale());
  const content = await fetchCancellationsPage();

  const [testimonials, refundForm] = await Promise.all([
    serverApi.home.testimonials(4).catch(() => []),
    content.cancellations.refundFormId
      ? fetchForm(content.cancellations.refundFormId)
      : Promise.resolve(null),
  ]);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Cancellations & Refunds",
    description: content.cancellations.hero.text,
    url: `${env.SITE_URL.replace(/\/$/, "")}/cancellations`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(pageSchema) }}
      />

      <section className="bg-white py-16">
        <div className="container max-w-3xl text-center">
          <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-[#00bbf0]">
            {content.cancellations.hero.eyebrow}
          </p>
          <h1 className="mt-3 font-suse text-3xl font-bold text-neutral-900 md:text-4xl">
            {content.cancellations.hero.heading}
          </h1>
          <p className="mt-4 font-open-sans text-neutral-600">{content.cancellations.hero.text}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline" className="border-neutral-300">
              <Link href="/support-request">{content.cancellations.cta.supportLabel}</Link>
            </Button>
            <Button asChild className="bg-secondary-500 text-white hover:bg-secondary-600">
              <a href="#refund-form">{content.cancellations.cta.refundLabel}</a>
            </Button>
          </div>
        </div>
      </section>

      <ReviewsSection
        testimonials={testimonials}
        title="From frustrated to satisfied"
        subtitle="Customers who had problems — and how we sorted them out"
        showViewAllLink={false}
      />

      <section className="py-16">
        <div className="container max-w-3xl">
          <h2 className="font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
            Start with what happened
          </h2>
          <p className="mt-3 font-open-sans text-sm text-neutral-600">
            Many refund requests begin as access, billing, or course selection issues. Pick the
            closest option so we can route you faster.
          </p>
          <div className="mt-8">
            <IssueTypePicker linkMode />
          </div>
          <p className="mt-6 font-open-sans text-sm text-neutral-500">
            <a
              href="#refund-form"
              className="font-semibold text-secondary-500 underline hover:text-secondary-600"
            >
              None of these apply — continue to refund request
            </a>
          </p>
        </div>
      </section>

      <section id="refund-form" className="scroll-mt-28 bg-white py-16">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="mx-auto w-full max-w-xl lg:mx-0">
              <h2 className="font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
                Refund request details
              </h2>
              <p className="mt-3 font-open-sans text-sm text-neutral-600">
                Use this form when support cannot solve the issue, or when you simply need the
                purchase reviewed against the refund policy.
              </p>
              <div className="mt-8">
                <RefundRequestForm form={refundForm} formId={content.cancellations.refundFormId} />
              </div>
            </div>
            <div className="hidden lg:block">
              <SupportSidebar variant="refund" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
