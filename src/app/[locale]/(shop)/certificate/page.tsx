import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { CertificateForm } from "@/components/certificate/certificate-form";
import { certificateService } from "@/lib/services/certificate";
import type { CertPageContent } from "@/types/certificate";

export const revalidate = 3600;

const DEFAULT_HERO_HEADING = "Power Your Professional Growth with CPD Certification & Transcript";
const DEFAULT_BENEFITS = [
  "Showcase Your Professional Growth",
  "Strengthen Your CV & Career Opportunities",
  "Meet CPD & Professional Requirements",
];
const DEFAULT_ORDER_HEADING = "Order Your New Certificate";
const DEFAULT_PROMO_LABEL = "Promotional Banner";

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/certificate");
  return buildPageMetadata(seo, {
    title: "Order Your Certificate | Training Excellence",
    description:
      "Order your official CPD-accredited certificate and transcript. Digital and printed copies available — showcase your professional growth.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/certificate`,
  });
}

export default async function CertificatePage() {
  setRequestLocale(await getLocale());

  const content = await certificateService.getPage().catch(() => null);

  const heroHeading = content?.hero.heading || DEFAULT_HERO_HEADING;
  const benefits = content?.hero.benefits.length ? content.hero.benefits : DEFAULT_BENEFITS;
  const heroImages = content?.hero.images ?? [];
  const orderHeading = content?.orderSection.heading || DEFAULT_ORDER_HEADING;
  const promoBanner = content?.promoBanner;

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="relative w-full overflow-hidden py-14"
        style={{ background: "linear-gradient(88deg, rgb(0, 32, 74) 0%, rgb(0, 79, 101) 100.15%)" }}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden opacity-10 sm:h-20">
          <div className="absolute top-0 left-1/2 flex h-[405.89px] w-[max(100%,1920px)] -translate-x-1/2 items-center justify-center">
            <div className="shrink-0 -rotate-90">
              <Image
                src="/images/course-banner-wave.svg"
                alt=""
                width={406}
                height={1920}
                decoding="async"
                className="block h-[1920px] w-[405.89px] max-w-none"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
        <div className="container py-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <h1 className="font-suse text-3xl leading-tight font-bold text-white md:text-4xl">
                {heroHeading}
              </h1>
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
              {heroImages.length > 0 ? (
                heroImages.map((img, i) => (
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
              ) : (
                <>
                  <div className="relative h-[231px] w-[306px] shrink-0">
                    <Image
                      src="/images/certificate/hero-certificate.jpg"
                      alt="Sample CPD accredited certificate"
                      fill
                      sizes="306px"
                      className="rounded-lg object-cover shadow-[4px_4px_10px_0px_rgba(0,0,0,0.25),16px_18px_15px_0px_rgba(0,0,0,0.2)]"
                    />
                  </div>
                  <div className="relative h-[260px] w-[196px] shrink-0">
                    <Image
                      src="/images/certificate/hero-transcript.jpg"
                      alt="Sample official transcript"
                      fill
                      sizes="196px"
                      className="rounded-lg object-cover shadow-[4px_4px_10px_0px_rgba(0,0,0,0.25),16px_18px_15px_0px_rgba(0,0,0,0.2)]"
                    />
                  </div>
                </>
              )}
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
                <CertificateForm />
              </div>
            </div>

            {/* Promo sidebar */}
            <aside className="hidden lg:block">
              <PromoBanner promoBanner={promoBanner} />
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

function PromoBanner({ promoBanner }: { promoBanner: CertPageContent["promoBanner"] | undefined }) {
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
        {promoBanner?.heading || DEFAULT_PROMO_LABEL}
      </span>
    </div>
  );
}
