import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { CertificateForm } from "@/components/certificate/certificate-form";
import { HeroWave, HERO_GRADIENT } from "@/components/courses/hero-wave";
import type { CertPageContent, CertProductSlug } from "@/types/certificate";

/**
 * Shared layout for the certificate ordering pages (`/certificate`,
 * `/hardcopy-certificate`): navy hero with benefits + sample imagery, the order
 * card, and the sidebar promo banner.
 *
 * The two pages differ only in copy, imagery, and which offer they sell — the
 * order form itself is entirely schema-driven off the product's backend config,
 * so there are no per-product branches below.
 */

/** A bundled fallback hero image, with its intrinsic Figma dimensions. */
export interface CertHeroFallbackImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface CertificatePageDefaults {
  heroHeading: string;
  /** Optional supporting line under the H1. */
  heroText?: string;
  benefits: readonly string[];
  orderHeading: string;
  promoLabel: string;
  heroImages: readonly CertHeroFallbackImage[];
}

export interface CertificatePageShellProps {
  /** The plugin product slug this page sells. */
  product: CertProductSlug;
  /** Editable CMS content, or `null` when the fetch failed. */
  content: CertPageContent | null;
  /** Static copy used per-field wherever `content` is empty, null, or missing. */
  defaults: CertificatePageDefaults;
}

export function CertificatePageShell({ product, content, defaults }: CertificatePageShellProps) {
  // The content endpoint is addressed by path, so a response belongs to the product
  // that was asked for — and a plugin that does not serve `/certificate/{product}/page`
  // 404s, which surfaces here as `content: null` and the static defaults.
  //
  // This only rejects content that explicitly names a *different* product, which
  // would mean the endpoint aliased our slug onto another offer's ACF record. Cheap
  // consistency check; it costs imagery, not correctness of price, so it degrades to
  // the defaults rather than blocking the page.
  const ownContent = content && (content.product ?? product) === product ? content : null;

  // Per-field fallback: a partially-configured CMS page must not blank out the
  // fields it does not set.
  const heroHeading = ownContent?.hero.heading || defaults.heroHeading;
  const heroText = ownContent?.hero.text || defaults.heroText;
  const benefits = ownContent?.hero.benefits.length ? ownContent.hero.benefits : defaults.benefits;
  const heroImages = ownContent?.hero.images ?? [];
  const orderHeading = ownContent?.orderSection.heading || defaults.orderHeading;
  const promoBanner = ownContent?.promoBanner;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden" style={{ background: HERO_GRADIENT }}>
        <HeroWave />
        <div className="container py-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <h1 className="font-suse text-3xl leading-tight font-bold text-white md:text-4xl">
                {heroHeading}
              </h1>
              {heroText && (
                <p className="font-open-sans text-neutral-30 mt-4 text-base">{heroText}</p>
              )}
              <ul className="mt-6 space-y-3">
                {benefits.map((b) => (
                  <li
                    key={b}
                    className="font-open-sans text-neutral-30 flex items-center gap-3 text-sm"
                  >
                    <CheckCircle2 className="text-primary-500 h-5 w-5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden items-center gap-6 lg:flex">
              {heroImages.length > 0
                ? heroImages.map((img, i) => (
                    <div
                      key={img.url}
                      className={i % 2 === 1 ? "relative mt-6 h-56 w-44" : "relative h-56 w-44"}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt}
                        fill
                        sizes="176px"
                        className="rounded-lg object-cover shadow-[4px_4px_10px_0px_rgba(0,0,0,0.25),16px_18px_15px_0px_rgba(0,0,0,0.2)]"
                      />
                    </div>
                  ))
                : defaults.heroImages.map((img) => (
                    <div
                      key={img.src}
                      className="relative shrink-0"
                      style={{ width: img.width, height: img.height }}
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes={`${img.width}px`}
                        className="rounded-lg object-cover shadow-[4px_4px_10px_0px_rgba(0,0,0,0.25),16px_18px_15px_0px_rgba(0,0,0,0.2)]"
                      />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Order area ────────────────────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              <div className="border-neutral-20 rounded-lg border p-6">
                <h2 className="font-suse mb-6 text-2xl font-bold text-neutral-900">
                  {orderHeading}
                </h2>
                <CertificateForm product={product} />
              </div>
            </div>

            {/* Promo sidebar */}
            <aside className="hidden lg:block">
              <PromoBanner promoBanner={promoBanner} fallbackLabel={defaults.promoLabel} />
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

function PromoBanner({
  promoBanner,
  fallbackLabel,
}: {
  promoBanner: CertPageContent["promoBanner"] | undefined;
  fallbackLabel: string;
}) {
  if (promoBanner?.image) {
    return (
      <div className="relative h-[453px] w-full overflow-hidden rounded-2xl">
        <Image
          src={promoBanner.image.url}
          alt={promoBanner.image.alt}
          fill
          sizes="320px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[453px] items-center justify-center rounded-2xl bg-linear-to-b from-neutral-800 to-neutral-700 p-6 text-center">
      <span className="font-suse text-lg font-semibold text-white/90">
        {promoBanner?.heading || fallbackLabel}
      </span>
    </div>
  );
}
