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
      <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
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
                className="border-secondary-500 text-secondary-500 hover:bg-secondary-50 font-open-sans inline-flex items-center rounded border px-6 py-4 text-base leading-normal transition-colors"
              >
                {data.cta.label}
              </Link>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="flex items-center justify-center gap-6">
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                className={`rounded-lg object-contain shadow-lg ${i === 0 ? "w-2/3" : "w-1/3"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
