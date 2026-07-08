import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeWhyPanel } from "@/types/home";

interface WhySectionProps {
  panels?: HomeWhyPanel[];
}

export function WhySection({ panels }: WhySectionProps) {
  if (!panels?.length) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="container flex flex-col gap-16 lg:gap-20">
        {panels.map((panel, idx) => {
          const isImageLeft = panel.side === "left";

          return (
            <div
              key={`${panel.title}-${idx}`}
              className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-0"
            >
              <div
                className={`flex flex-col gap-4 lg:col-span-7 ${
                  isImageLeft ? "lg:order-2 lg:col-start-6" : "lg:order-1 lg:col-start-1"
                }`}
              >
                <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900">
                  {panel.title}
                </h2>

                {panel.body && (
                  <p className="font-open-sans text-base leading-normal text-neutral-500">
                    {panel.body}
                  </p>
                )}

                {panel.bullets && (
                  <ul className="flex flex-col gap-3">
                    {panel.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="font-open-sans flex items-start gap-2 text-base leading-normal text-neutral-500"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-500" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={panel.cta.href}
                  className="font-open-sans text-secondary-500 hover:text-secondary-600 inline-flex items-center gap-2 text-base leading-7 font-medium transition-colors"
                >
                  {panel.cta.label}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div
                className={`relative h-72 w-full overflow-hidden rounded-2xl lg:col-span-3 lg:h-80 ${
                  isImageLeft ? "lg:order-1 lg:col-start-1" : "lg:order-2 lg:col-start-10"
                }`}
              >
                <img
                  src={panel.gif}
                  alt={panel.gifAlt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
