import Image from "next/image";
import Link from "next/link";
import { FallbackImage } from "@/components/ui/fallback-image";
import { HomeIcon } from "./home-icon";
import type { HomeTeamSection } from "@/types/home";

interface TransformTeamProps {
  data?: HomeTeamSection;
}

export function TransformTeam({ data }: TransformTeamProps) {
  if (!data?.title) return null;

  const images = data.images ?? [];

  return (
    <section
      className="relative overflow-hidden py-14 lg:py-16"
      style={{ background: "linear-gradient(113.58deg, #00204a 0%, #004f65 100%)" }}
    >
      {/* Purely decorative backdrop — empty alt keeps it out of the a11y tree. */}
      <Image
        src="https://trainingexcellence-media.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/07/16092625/transfrom-team-bg-shape.png"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="absolute inset-0 object-cover"
      />

      <div className="container flex flex-col items-center justify-between gap-10">
        <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
          <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-white">{data.title}</h2>
          {data.description && (
            <p className="font-open-sans text-neutral-40 text-base leading-normal">
              {data.description}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-33.5">
          <ul className="flex w-full max-w-131.5 flex-col gap-8">
            {data.bullets?.map((bullet, i) => (
              <li key={`${bullet.title}-${i}`} className="flex items-start justify-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-600 p-2">
                  <div className="bg-primary-600 flex h-10 w-10 items-center justify-center rounded-full">
                    <HomeIcon name={bullet.icon} className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <h3 className="font-suse text-lg leading-[1.2] font-bold text-white">
                    {bullet.title}
                  </h3>
                  <p className="font-open-sans text-neutral-40 text-base leading-normal">
                    {bullet.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {images.length > 0 && (
            <div className="flex shrink-0 items-center gap-6">
              {/* Explicit dimensions reserve the space so the section does not
                  shift as these load. Decorative team photography — the section
                  heading and bullets carry the meaning. FallbackImage because
                  production's paths (`/images/team/collaboration-*.jpg`) are not
                  in `public/` and 404 — an absent photo beats an empty box. */}
              <div className="flex h-auto w-76.5 flex-col gap-6">
                {images.slice(0, 2).map((src) => (
                  <FallbackImage
                    key={src}
                    src={src}
                    alt=""
                    aria-hidden
                    width={306}
                    height={200}
                    className="w-full flex-1 object-cover"
                  />
                ))}
              </div>
              <FallbackImage
                src={images[2]}
                alt=""
                aria-hidden
                width={306}
                height={424}
                className="h-auto w-76.5 object-cover"
              />
            </div>
          )}
        </div>

        {data.cta?.href && (
          <Link
            href={data.cta.href}
            className="bg-secondary-500 hover:bg-secondary-600 font-open-sans inline-flex w-50 cursor-pointer items-center justify-center rounded-full px-6 py-4 text-base leading-normal text-white transition-opacity hover:opacity-90"
          >
            {data.cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}
