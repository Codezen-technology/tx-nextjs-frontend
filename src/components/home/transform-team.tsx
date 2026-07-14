import Link from "next/link";
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
      className="py-14 lg:py-16"
      style={{ background: "linear-gradient(113.58deg, #00204a 0%, #004f65 100%)" }}
    >
      <div className="container flex flex-col items-center gap-10">
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
              <div className="flex h-105 w-76.5 flex-col gap-6">
                {images.slice(0, 2).map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="w-full flex-1 rounded-xl object-cover"
                  />
                ))}
              </div>
              {images[2] && (
                <img src={images[2]} alt="" className="h-105 w-76.5 rounded-xl object-cover" />
              )}
            </div>
          )}
        </div>

        {data.cta?.href && (
          <Link
            href={data.cta.href}
            className="bg-secondary-500 font-open-sans inline-flex w-50 items-center justify-center rounded-full px-6 py-4 text-base leading-normal text-white transition-opacity hover:opacity-90"
          >
            {data.cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}
