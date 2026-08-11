import { FallbackImage } from "@/components/ui/fallback-image";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AboutIcon } from "./about-icon";
import { AboutImagePlaceholder } from "./about-image-placeholder";
import type { AboutCommitmentSection as AboutCommitmentSectionData } from "@/types/about";

/** Figma's two "Features section" blocks (node 649:44791) — alternating icon/heading/checklist/image rows. */
export function AboutCommitmentSection({ data }: { data: AboutCommitmentSectionData }) {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-suse text-3xl font-bold text-[#111a2b] sm:text-[40px]">
          {data.heading}
        </h2>
        <p className="font-open-sans mt-5 text-lg font-light text-neutral-500 sm:text-xl">
          {data.subheading}
        </p>
      </div>

      <div className="mt-16 flex flex-col gap-20 lg:gap-24">
        {data.blocks.map((block, i) => {
          const reversed = i % 2 === 1;
          return (
            <div
              key={block.heading}
              className={cn(
                "container mx-auto grid grid-cols-1 items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16",
              )}
            >
              <div className={cn("flex flex-col gap-6", reversed && "lg:order-2")}>
                <AboutIcon icon={block.icon} />
                <div className="flex flex-col gap-4">
                  <h3 className="font-suse text-2xl font-bold whitespace-pre-line text-neutral-900 sm:text-[32px]">
                    {block.heading}
                  </h3>
                  <p className="font-open-sans text-lg font-light text-neutral-500 sm:text-xl">
                    {block.text}
                  </p>
                </div>
                <ul className="flex flex-col gap-3">
                  {block.check_items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="text-primary-500 mt-0.5 h-5 w-5 shrink-0" />
                      <span className="font-open-sans text-base text-neutral-500">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* The sized `aspect-4/3.5` wrapper is always rendered, so the row
                  keeps its layout whether the image loads, fails, or is unset.
                  FallbackImage covers the third case QA hit: a field that holds a
                  URL which 404s, which would otherwise render a broken image. */}
              <div
                className={cn(
                  "relative aspect-4/3.5 w-full overflow-hidden rounded-xl",
                  reversed && "lg:order-1",
                )}
              >
                <FallbackImage
                  src={block.image}
                  alt={block.heading}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  fallback={
                    <AboutImagePlaceholder label={block.heading} className="h-full w-full" />
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
