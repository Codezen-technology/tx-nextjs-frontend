import Link from "next/link";
import { FallbackImage } from "@/components/ui/fallback-image";
import type { HomeCertificateSection } from "@/types/home";

interface CpdCertificateProps {
  data?: HomeCertificateSection;
}

/**
 * Production's `certificate.images` points at `/images/certificate/
 * certificate-frame.png` and `/transcript.png`, which are not in `public/` —
 * both 404 and the section renders two empty boxes (QA: "certificate and
 * transcript not rendering"). These are the equivalent assets that do ship, so
 * the section renders correctly while the CMS paths are corrected.
 */
const CERTIFICATE_FALLBACKS = [
  "/images/certificate/hero-certificate.jpg",
  "/images/certificate/hero-transcript.jpg",
];

export function CpdCertificate({ data }: CpdCertificateProps) {
  if (!data?.title) return null;

  // Fall back to the bundled assets wholesale when the CMS supplies none.
  const images = data.images?.length ? data.images : CERTIFICATE_FALLBACKS;

  return (
    <section className="py-16 lg:py-20">
      <div className="container flex flex-row items-center justify-between gap-10 lg:grid-cols-2">
        <div className="flex max-w-none flex-col gap-4 md:max-w-104">
          <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900">
            {data.title}
          </h2>
          {data.description && (
            <p className="font-open-sans text-base leading-normal text-neutral-500">
              {data.description}
            </p>
          )}
          {data.cta?.href && (
            <div>
              <Link
                href={data.cta.href}
                className="bg-secondary-500 hover:bg-primary-600 font-open-sans mt-4 inline-flex w-50 cursor-pointer items-center justify-center rounded-full px-6 py-4 text-base leading-normal text-white transition-colors transition-opacity hover:opacity-90"
              >
                {data.cta.label}
              </Link>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="bg-neutral-20 flex items-center gap-6 rounded-lg p-10">
            {/* Certificate imagery is content, not decoration — it gets real alt
                text. Explicit dimensions reserve the space and stop the section
                shifting as the images load. */}
            <FallbackImage
              src={images[0]}
              fallbackSrc={CERTIFICATE_FALLBACKS[0]}
              alt={`${data.title} — sample certificate`}
              width={280}
              height={396}
              // w-70 (280px), not w-auto: `width: auto` resolves against the
              // image's intrinsic size, so a source that fails to decode
              // collapses the box to 0x0 and the section renders empty.
              className="h-auto w-70 max-w-full rounded-lg object-cover"
            />
            <FallbackImage
              src={images[1]}
              fallbackSrc={CERTIFICATE_FALLBACKS[1]}
              alt={`${data.title} — sample transcript`}
              width={280}
              height={396}
              className="h-auto w-70 max-w-full rounded-lg object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
