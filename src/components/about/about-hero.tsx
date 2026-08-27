import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AboutHero as AboutHeroData } from "@/types/about";

/** Figma's "Header section" (node 649:44774) — eyebrow, H1, subtext, two CTAs. */
export function AboutHero({ data }: { data: AboutHeroData }) {
  return (
    <section className="bg-neutral-20 py-24 text-center">
      <div className="container mx-auto max-w-4xl px-4">
        <p className="font-open-sans text-primary-500 text-base font-bold">{data.eyebrow}</p>
        <h1 className="font-suse mt-3 text-4xl font-bold text-neutral-900 sm:text-5xl">
          {data.heading}
        </h1>
        <p className="font-open-sans mx-auto mt-6 max-w-2xl text-lg font-light text-neutral-500 sm:text-xl">
          {data.subheading}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href={data.secondary_button.href}>{data.secondary_button.label}</Link>
          </Button>
          <Button asChild className="bg-secondary-600 hover:bg-secondary-700 text-white">
            <Link href={data.primary_button.href}>{data.primary_button.label}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
