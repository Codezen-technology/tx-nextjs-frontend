import Link from "next/link";
import type { HomeCertificateSection } from "@/types/home";

interface CpdCertificateProps {
  data?: HomeCertificateSection;
}

export function CpdCertificate({ data }: CpdCertificateProps) {
  if (!data?.title) return null;

  const images = data.images ?? [];

  return (
    <section className="py-16 lg:py-20">
      <div className="container flex flex-row items-center justify-between gap-10 lg:grid-cols-2">
        <div className="flex max-w-none flex-col gap-4 md:max-w-[416px]">
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
          <div className="flex items-center gap-6 rounded-lg bg-[#f5f6f8] p-10">
            {images[0] && (
              <img src={images[0]} alt="" className="h-auto w-auto rounded-lg object-cover" />
            )}
            {images[1] && (
              <img src={images[1]} alt="" className="h-auto w-auto rounded-lg object-cover" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
