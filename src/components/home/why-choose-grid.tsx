import { cn } from "@/lib/utils/cn";
import { HomeIcon } from "./home-icon";
import type { HomeWhyFeature } from "@/types/home";

interface WhyChooseGridProps {
  features?: HomeWhyFeature[];
}

export function WhyChooseGrid({ features }: WhyChooseGridProps) {
  if (!features?.length) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="container flex flex-col items-center gap-6 lg:flex-row lg:gap-6">
        <div className="flex w-full flex-col gap-4 lg:w-104 lg:shrink-0">
          <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900">
            Why Choose Us
          </h2>
          <p className="font-open-sans text-base leading-normal text-neutral-500">
            Explore our wide range of online courses covering areas like Health & Safety,ace.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 sm:grid-cols-2">
          {features.map((feature, i) => {
            const isTopRow = i < 2;
            const isLeftCol = i % 2 === 0;
            return (
              <div
                key={`${feature.title}-${i}`}
                className={cn(
                  "flex items-start gap-4 p-6",
                  !isTopRow && "border-neutral-30 border-t",
                  isLeftCol && "border-neutral-30 sm:border-r",
                )}
              >
                <div className="bg-primary-50 flex shrink-0 items-start rounded-[28px] p-2">
                  <div className="bg-primary-100 flex shrink-0 items-start rounded-[20px] p-2">
                    <HomeIcon name={feature.icon} className="h-6 w-6 text-[#00BBF0]" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <h3 className="font-suse text-[20px] leading-[1.2] font-bold text-neutral-900">
                    {feature.title}
                  </h3>
                  <p className="font-open-sans text-base leading-normal text-neutral-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
