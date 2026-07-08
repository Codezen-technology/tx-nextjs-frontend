import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { normalizeBundle } from "@/lib/services/bundles";
import { BundlesGrid } from "@/components/bundles/bundles-grid";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/bundles");
  return buildPageMetadata(seo, {
    title: "Course Bundles | Training Excellence",
    description:
      "Save with our accredited course bundles — multiple online courses grouped together at one discounted price. Instant certificates on completion.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/bundles`,
  });
}

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Course Bundles",
  description: "Accredited online course bundles at discounted prices.",
  url: `${env.SITE_URL.replace(/\/$/, "")}/bundles`,
};

export default async function BundlesPage() {
  const res = await serverApi.bundles.list({ per_page: 24 }).catch(() => null);
  const bundles = (res?.items ?? []).map(normalizeBundle);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(SCHEMA) }}
      />

      <section className="bg-neutral-900 py-12">
        <div className="container">
          <h1 className="font-suse text-3xl font-bold text-white md:text-4xl">Course Bundles</h1>
          <p className="font-open-sans mt-3 max-w-2xl text-white/70">
            Grouped courses at one discounted price — perfect for covering a whole role or topic.
            Each bundle includes free digital certificates on completion.
          </p>
        </div>
      </section>

      <div className="py-12">
        <div className="container">
          <BundlesGrid bundles={bundles} />
        </div>
      </div>
    </>
  );
}
