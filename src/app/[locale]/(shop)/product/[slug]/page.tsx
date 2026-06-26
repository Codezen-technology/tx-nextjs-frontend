import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api/server";
import { normalizeProduct } from "@/lib/services/products";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { truncate, stripHtml } from "@/lib/utils/format";
import { env } from "@/lib/env";
import { ProductAddToCart } from "@/components/product/product-add-to-cart";
import type { Product } from "@/types/product";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  setRequestLocale(await getLocale());
  const siteUrl = env.SITE_URL.replace(/\/$/, "");
  try {
    const [rows, seo] = await Promise.all([
      serverApi.products.bySlug(slug),
      fetchRankMathSeo(`/product/${slug}`),
    ]);
    const raw = rows?.[0];
    if (!raw) throw new Error("not found");
    const product = normalizeProduct(raw);
    return buildPageMetadata(seo, {
      title: product.name,
      description: truncate(stripHtml(product.shortDescription || product.description), 160),
      image: product.image?.src,
      canonical: `${siteUrl}/product/${slug}`,
    });
  } catch {
    return {
      title: "Product | Training Excellence",
      alternates: { canonical: `${siteUrl}/product/${slug}` },
    };
  }
}

function buildProductSchema(p: Product, url: string): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: truncate(stripHtml(p.shortDescription || p.description), 300),
    url,
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.image ? { image: p.image.src } : {}),
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: p.currencyCode,
      availability: p.isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
    },
  };
  if (p.averageRating > 0 && p.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: p.averageRating,
      reviewCount: p.reviewCount,
    };
  }
  return schema;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  setRequestLocale(await getLocale());

  const [rowsResult, seoResult] = await Promise.allSettled([
    serverApi.products.bySlug(slug),
    fetchRankMathSeo(`/product/${slug}`),
  ]);

  const raw = rowsResult.status === "fulfilled" ? rowsResult.value?.[0] : null;
  if (!raw) notFound();

  const product = normalizeProduct(raw);
  const rmSeo = seoResult.status === "fulfilled" ? seoResult.value : null;
  const siteUrl = env.SITE_URL.replace(/\/$/, "");
  const productUrl = rmSeo?.canonical ?? `${siteUrl}/product/${slug}`;
  const jsonLd = rmSeo?.jsonLd?.length ? rmSeo.jsonLd : [buildProductSchema(product, productUrl)];

  const showStrike = product.onSale && product.regularPrice > product.price;
  const disabledReason = !product.isPurchasable
    ? "Unavailable"
    : !product.isInStock
      ? "Out of stock"
      : product.hasOptions
        ? "Options required"
        : undefined;

  return (
    <div className="min-h-screen bg-white">
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }}
        />
      ))}

      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-neutral-500">
          <Link href="/" className="hover:text-secondary-600">
            Home
          </Link>
          <span className="px-2">/</span>
          <span className="text-neutral-700">{product.name}</span>
        </nav>

        {/* Image */}
        {product.image?.src && (
          <div className="mb-8 overflow-hidden rounded-lg border border-neutral-200">
            <Image
              src={product.image.src}
              alt={product.image.alt || product.name}
              width={768}
              height={480}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold text-neutral-900">{product.name}</h1>

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-3">
          {showStrike && (
            <span className="text-lg text-neutral-400 line-through">
              {product.regularPriceFormatted}
            </span>
          )}
          <span className="text-3xl font-bold text-neutral-900">{product.priceFormatted}</span>
        </div>

        {/* Short description */}
        {product.shortDescription && (
          <div
            className="mt-6 space-y-4 text-neutral-700 [&_a]:text-secondary-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: product.shortDescription }}
          />
        )}

        {/* Add to cart */}
        <div className="mt-8 max-w-sm">
          <ProductAddToCart
            productId={product.id}
            label={product.addToCartText}
            disabledReason={disabledReason}
          />
        </div>

        {/* Full description */}
        {product.description && (
          <section className="mt-12 border-t border-neutral-200 pt-8">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">Description</h2>
            <div
              className="space-y-4 text-neutral-700 [&_a]:text-secondary-600 [&_a]:underline [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </section>
        )}
      </div>
    </div>
  );
}
