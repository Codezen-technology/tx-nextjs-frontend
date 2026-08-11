import { FallbackImage } from "@/components/ui/fallback-image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AboutImagePlaceholder } from "./about-image-placeholder";
import type { AboutTeam } from "@/types/about";

/** Photo collage geometry, ported from Figma's absolute layout (node 651:23085, 616×496 box) as percentages. */
const PHOTO_SLOTS = [
  { left: "51.3%", top: "0%", width: "26%", height: "48.4%" },
  { left: "65.6%", top: "51.6%", width: "31.2%", height: "32.3%" },
  { left: "3.3%", top: "51.6%", width: "31.2%", height: "38.7%" },
  { left: "37%", top: "51.6%", width: "26%", height: "48.4%" },
  { left: "22.7%", top: "16.1%", width: "26%", height: "32.3%" },
];

/** Figma's "Team section" (node 651:23074) — copy + a 5-photo scattered collage. */
export function AboutTeamSection({ data }: { data: AboutTeam }) {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <p className="font-open-sans text-primary-500 text-base font-bold">{data.eyebrow}</p>
            <h2 className="font-suse text-3xl font-bold text-neutral-900 sm:text-[40px]">
              {data.heading}
            </h2>
            <p className="font-open-sans text-lg font-light text-neutral-500 sm:text-xl">
              {data.text}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={data.secondary_button.href}>{data.secondary_button.label}</Link>
            </Button>
            <Button asChild className="bg-secondary-500 hover:bg-secondary-600 text-white">
              <Link href={data.primary_button.href}>{data.primary_button.label}</Link>
            </Button>
          </div>
        </div>

        <div className="relative aspect-616/496 w-full">
          {PHOTO_SLOTS.map((slot, i) => {
            const src = data.photos[i];
            return (
              <div
                key={i}
                className="absolute overflow-hidden rounded-2xl"
                style={{ left: slot.left, top: slot.top, width: slot.width, height: slot.height }}
              >
                <FallbackImage
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, 40vw"
                  fallback={<AboutImagePlaceholder label="" className="h-full w-full" />}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
