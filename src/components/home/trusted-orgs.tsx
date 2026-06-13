"use client";

import type { HomeTrustedOrg } from "@/types/home";
import fallbackSponsors from "@/data/home/sponsors.json";

interface TrustedOrgsProps {
  sponsors?: HomeTrustedOrg[];
}

export function TrustedOrgs({ sponsors = fallbackSponsors }: TrustedOrgsProps) {
  if (!sponsors.length) return null;

  // Duplicate sponsors array so infinite scrolling works seamlessly
  const track = [...sponsors, ...sponsors];

  return (
    <section className="overflow-hidden bg-secondary-50 py-12">
      <div className="flex items-center gap-8 pl-4 2xl:pl-[calc((100vw-1400px)/2+1rem)]">
        {/* Heading */}
        <div className="flex w-[446px] shrink-0 flex-col gap-4">
          <div className="h-0.5 w-24 bg-secondary-500" />
          <h2 className="font-suse text-[32px] font-medium leading-[1.2] text-neutral-900">
            Trusted by Over 50,000 Organizations Worldwide
          </h2>
        </div>

        {/* Marquee — flex-1 fills remaining width */}
        <div className="flex-1 overflow-hidden">
          <div className="inline-flex animate-infinite-scroll items-center gap-6 whitespace-nowrap [will-change:transform] [&:hover]:[animation-play-state:paused]">
            {track.map((sponsor, i) => (
              <img
                key={i}
                src={sponsor.src}
                alt={sponsor.alt}
                className="h-14 w-auto shrink-0 object-contain"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
