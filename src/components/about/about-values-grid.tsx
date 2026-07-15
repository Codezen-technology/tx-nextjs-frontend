import { AboutIcon } from "./about-icon";
import type { AboutValues } from "@/types/about";

/** Figma's "Our values" Features section (node 649:44913) — eyebrow/heading + 6-card grid. */
export function AboutValuesGrid({ data }: { data: AboutValues }) {
  return (
    <section className="bg-[#f9fafb] py-16 lg:py-24">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <p className="font-open-sans text-primary-500 text-base font-bold">{data.eyebrow}</p>
        <h2 className="font-suse mt-3 text-3xl font-medium text-neutral-900 sm:text-[40px]">
          {data.heading}
        </h2>
      </div>

      <div className="container mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-x-8 gap-y-12 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.cards.map((card) => (
          <div key={card.title} className="flex flex-col items-center gap-5 text-center">
            <AboutIcon icon={card.icon} />
            <div className="flex flex-col gap-2">
              <h3 className="font-open-sans text-xl font-bold text-neutral-900">{card.title}</h3>
              <p className="font-open-sans text-base text-neutral-500">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
