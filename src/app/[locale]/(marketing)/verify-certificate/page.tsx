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
          <div className="border-neutral-30 rounded-xl border bg-white p-8 shadow-xs sm:p-10">
            <div className="text-center">
              <p className="font-open-sans text-secondary-500 text-sm font-semibold tracking-wide uppercase">
                Certificate Validator
              </p>
              <h1 className="font-suse mt-2 text-3xl font-bold text-neutral-900">
                Check Certificate
              </h1>
              <p className="font-open-sans mt-3 text-sm text-neutral-500">
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
