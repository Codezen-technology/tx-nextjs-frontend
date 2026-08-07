import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { fetchCancellationsPage } from "@/lib/services/cancellations.server";
import { fetchForm } from "@/lib/services/forms.server";
import { ReviewsSection } from "@/components/home/reviews-section";
import { CancellationsHero } from "@/components/cancellations/cancellations-hero";
import { IssueTypePicker } from "@/components/cancellations/issue-type-picker";
import { CANCELLATIONS_ISSUE_GATE } from "@/lib/constants/support-issues";
import { RefundFormSection } from "@/components/cancellations/refund-form-section";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo(wpPath.page("cancellations"));
  return buildPageMetadata(seo, {
    title: "Cancellations & Refunds",
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
        <div className="container max-w-3xl">
          <CancellationsHero
            eyebrow={content.cancellations.hero.eyebrow}
            heading={content.cancellations.hero.heading}
            text={content.cancellations.hero.text}
            align="center"
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="outline" className="border-neutral-300 bg-white">
                <Link href="/support-request">{content.cancellations.cta.supportLabel}</Link>
              </Button>
              <Button asChild className="bg-secondary-500 hover:bg-secondary-600 text-white">
                <Link href="/cancellations?refund=1#refund-form">
                  {content.cancellations.cta.refundLabel}
                </Link>
              </Button>
            </div>
          </CancellationsHero>
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
          <p className="font-open-sans mt-3 text-sm text-neutral-600">
            Many refund requests begin as access, billing, or course selection issues. Pick the
            closest option so we can route you faster.
          </p>
          <div className="mt-8">
            <IssueTypePicker linkMode issues={CANCELLATIONS_ISSUE_GATE} />
          </div>
          <p className="font-open-sans mt-6 text-sm text-neutral-500">
            <Link
              href="/cancellations?refund=1#refund-form"
              className="text-secondary-500 hover:text-secondary-600 font-semibold underline"
            >
              None of these apply — continue to refund request →
            </Link>
          </p>
        </div>
      </section>

      <Suspense
        fallback={
          <section id="refund-form" className="scroll-mt-28 bg-neutral-50/50 py-16">
            <div className="container max-w-5xl">
              <div className="h-48 animate-pulse rounded-xl bg-neutral-100" />
            </div>
          </section>
        }
      >
        <RefundFormSection
          form={refundForm}
          formId={content.cancellations.refundFormId}
          supportEmail={content.notificationEmail}
          heading="Refund request details"
          intro="Use this form when support cannot solve the issue, or when you simply need the purchase reviewed against the refund policy."
        />
      </Suspense>
    </>
  );
}
