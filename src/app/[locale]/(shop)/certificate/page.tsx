import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { CertificateForm } from "@/components/certificate/certificate-form";

export const revalidate = 3600;

const BENEFITS = [
  "Showcase Your Professional Growth",
  "Strengthen Your CV & Career Opportunities",
  "Meet CPD & Professional Requirements",
];

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

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-[#0d2b53]">
        <div className="container py-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <h1 className="font-suse text-3xl font-bold leading-tight text-white md:text-4xl">
                Power Your Professional Growth with CPD Certification &amp; Transcript
              </h1>
              <ul className="mt-6 space-y-3">
                {BENEFITS.map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-3 font-open-sans text-sm text-[#ebedf1]"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#00bbf0]" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden gap-4 lg:flex">
              <div className="h-56 w-44 rounded-lg bg-white/10 ring-1 ring-white/20" aria-hidden />
              <div
                className="mt-6 h-56 w-44 rounded-lg bg-white/10 ring-1 ring-white/20"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Order area ────────────────────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              {/* CPD accreditation strip */}
              <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#0d2b53] px-6 py-5 sm:flex-row">
                <p className="font-suse text-base font-semibold text-white">
                  Get an Official Accredited Certificate Directly from CPD Service
                </p>
                <span className="rounded-full bg-[#00bbf0] px-5 py-2 text-sm font-semibold text-[#0d2b53]">
                  CPD Accredited
                </span>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-6 shadow-sm md:p-8">
                <h2 className="mb-6 font-suse text-2xl font-bold text-neutral-900">
                  Order Your New Certificate
                </h2>
                <CertificateForm />
              </div>
            </div>

            {/* Promo sidebar */}
            <aside className="hidden lg:block">
              <div className="flex h-[453px] items-center justify-center rounded-2xl bg-gradient-to-b from-[#0d2b53] to-[#1c395e] p-6 text-center">
                <span className="font-suse text-lg font-semibold text-white/90">
                  Promotional Banner
                </span>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
