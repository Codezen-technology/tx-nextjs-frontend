import { cn } from "@/lib/utils/cn";
import { HomeIcon } from "./home-icon";
import type { HomeWhyFeature } from "@/types/home";
import Image from "next/image";

interface WhyChooseGridProps {
  features?: HomeWhyFeature[];
  image?: string;
}

export function WhyChooseGrid({ features, image }: WhyChooseGridProps) {
  if (!features?.length) return null;

  return (
    <section className="py-section bg-secondary-50 lg:py-14">
      <div className="container flex flex-col items-center gap-6 lg:flex-row lg:gap-6">
        <div className="flex w-full flex-col gap-6">
          <h2 className="font-suse text-2xl leading-[1.2] font-bold text-neutral-900 md:text-[32px]">
            Why Choose Us
          </h2>
          {/* <p className="font-open-sans text-base leading-normal text-neutral-500">
            Explore our wide range of online courses covering areas like Health & Safety,ace.
          </p> */}
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
            {features.map((feature, i) => {
              return (
                <div key={`${feature.title}-${i}`} className={cn("flex items-start gap-6")}>
                  <div className="bg-secondary-100 flex shrink-0 items-start rounded-[28px] p-2">
                    <div className="bg-secondary-500 flex shrink-0 items-start rounded-[20px] p-2">
                      <HomeIcon name={feature.icon} className="h-6 w-6 text-white" />
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

        {/* Right side image */}
        <div className="flex w-full justify-center lg:w-2/5">
          <Image
            src={image || "/images/why-choose-us.webp"}
            alt="Why Choose Us"
            width={480}
            height={360}
          />
        </div>
      </div>
    </section>
  );
}
