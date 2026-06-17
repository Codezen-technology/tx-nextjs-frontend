import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { CertificateVerifyForm } from "@/components/certificates/certificate-verify-form";

export const dynamic = "force-dynamic";

const VERIFY_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Certificate Validator | Training Excellence",
  description: "Verify the authenticity of a Training Excellence course certificate.",
};

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/verify-certificate");
  return buildPageMetadata(seo, {
    title: "Verify Certificate | Training Excellence",
    description:
      "Quickly and easily check the validity of your Training Excellence course certificate with our Course Certificate Validator tool.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/verify-certificate`,
  });
}

export default async function VerifyCertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const initialCode = code?.trim();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(VERIFY_SCHEMA) }}
      />
      <section className="bg-primary-50 py-20">
        <div className="container max-w-lg">
          <div className="rounded-xl border border-[#ebedf1] bg-white p-8 shadow-sm sm:p-10">
            <div className="text-center">
              <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-secondary-500">
                Certificate Validator
              </p>
              <h1 className="mt-2 font-suse text-3xl font-bold text-neutral-900">
                Check Certificate
              </h1>
              <p className="mt-3 font-open-sans text-sm text-neutral-500">
                Quickly and easily check the validity of your Training Excellence course
                certificates with Training Excellence&apos;s Course Certificate Validator tool.
              </p>
            </div>
            <div className="mt-8">
              <CertificateVerifyForm initialCode={initialCode} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
