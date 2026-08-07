import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { normalizeBundleDetail } from "@/lib/services/bundles";
import { BundleDetail } from "@/components/bundles/bundle-detail";

export const revalidate = 300;

interface BundlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const res = await serverApi.bundles.list({ per_page: 100 });
    return (res.items ?? []).flatMap((b) => (b.slug ? [{ slug: b.slug }] : []));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BundlePageProps): Promise<Metadata> {
  const { slug } = await params;
  setRequestLocale(await getLocale());
  try {
    const [raw, seo] = await Promise.all([
      serverApi.bundles.bySlug(slug),
      fetchRankMathSeo(wpPath.bundle(slug)),
    ]);
    const bundle = normalizeBundleDetail(raw);
    return buildPageMetadata(seo, {
      title: bundle.title,
      description:
        bundle.excerpt ||
        `${bundle.title} — ${bundle.includedCoursesCount} accredited courses in one discounted bundle.`,
      image: bundle.image?.large ?? bundle.image?.full,
      canonical: `${env.SITE_URL.replace(/\/$/, "")}/bundles/${slug}`,
    });
  } catch {
    return { title: "Bundle not found" };
  }
}

export default async function BundlePage({ params }: BundlePageProps) {
  const { slug } = await params;

  const raw = await serverApi.bundles.bySlug(slug).catch(() => null);
  if (!raw) notFound();

  const bundle = normalizeBundleDetail(raw);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bundle.title,
    description: bundle.excerpt,
    ...(bundle.image?.large || bundle.image?.full
      ? { image: [bundle.image.large ?? bundle.image.full] }
      : {}),
    ...(bundle.pricing.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: bundle.pricing.price,
            priceCurrency: bundle.pricing.currency,
            url: `${env.SITE_URL.replace(/\/$/, "")}/bundles/${slug}`,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />
      <BundleDetail bundle={bundle} />
    </>
  );
}
