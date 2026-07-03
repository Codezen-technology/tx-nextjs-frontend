import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { fetchCancellationsPage } from "@/lib/services/cancellations.server";
import { fetchForm } from "@/lib/services/forms.server";
import { ReviewsSection } from "@/components/home/reviews-section";
import { CancellationsHero } from "@/components/cancellations/cancellations-hero";
import { SupportRequestWizard } from "@/components/cancellations/support-request-wizard";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/support-request");
  return buildPageMetadata(seo, {
    title: "Get Support | Training Excellence",
    description:
      "Choose the issue that matches your situation and we will ask only for the details needed to fix it. Most course access, billing, and technical issues are resolved the same working day.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/support-request`,
  });
}

export default async function SupportRequestPage() {
  setRequestLocale(await getLocale());
  const content = await fetchCancellationsPage();

  const [testimonials, supportForm] = await Promise.all([
    serverApi.home.testimonials(4).catch(() => []),
    content.supportRequest.supportFormId
      ? fetchForm(content.supportRequest.supportFormId)
      : Promise.resolve(null),
  ]);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Get Support",
    description: content.supportRequest.hero.text,
    url: `${env.SITE_URL.replace(/\/$/, "")}/support-request`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(pageSchema) }}
      />

      <section className="bg-white py-16">
        <div className="container max-w-6xl">
          <CancellationsHero
            eyebrow={content.supportRequest.hero.eyebrow}
            heading={content.supportRequest.hero.heading}
            text={content.supportRequest.hero.text}
            headingEmphasis="out"
            align="center"
            showDot
            className="mx-auto mb-12 max-w-3xl"
          />

          <Suspense
            fallback={<div className="font-open-sans text-sm text-neutral-500">Loading…</div>}
          >
            <SupportRequestWizard
              form={supportForm}
              formId={content.supportRequest.supportFormId}
              supportEmail={content.notificationEmail}
            />
          </Suspense>
        </div>
      </section>

      <ReviewsSection
        testimonials={testimonials}
        title="From frustrated to satisfied"
        subtitle="Customers who had problems — and how we sorted them out"
        showViewAllLink={false}
      />
    </>
  );
}
