"use client";

import type { HomeTrustedOrgsSection } from "@/types/home";

interface TrustedOrgsProps {
  data?: HomeTrustedOrgsSection;
}

export function TrustedOrgs({ data }: TrustedOrgsProps) {
  const sponsors = data?.orgs;
  if (!sponsors?.length) return null;

  const track = [...sponsors, ...sponsors];

  return (
    <section className="bg-secondary-50 py-section overflow-hidden lg:py-12">
      {/* Bleeds off the right edge by design — the logo track scrolls out of the
          viewport — so it cannot be a `container`. `grid-inset-start` gives it
          the container's start edge without its max-width or its right padding. */}
      <div
        data-grid-surface="trusted-orgs"
        className="grid-inset-start flex flex-col items-center gap-8 md:flex-row"
      >
        <div className="flex w-[446px] shrink-0 flex-col gap-4 px-3 md:px-0">
          <div className="bg-secondary-500 h-0.5 w-24" />
          <h2 className="font-suse text-2xl leading-[1.2] font-bold text-neutral-900 md:text-[32px]">
            {data?.header?.title || "Trusted by Over 1000+ UK organisations"}
          </h2>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="animate-infinite-scroll inline-flex items-center gap-6 whitespace-nowrap will-change-transform [&:hover]:[animation-play-state:paused]">
            {track.map((sponsor, i) => (
              <img
                key={i}
                src={sponsor.src}
                alt={sponsor.alt}
                className="h-14 w-auto min-w-14 shrink-0 object-contain"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
