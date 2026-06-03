import Image from "next/image";
import { CheckCircle } from "lucide-react";

const REASONS = [
  {
    title: "Expert Knowledge, Simplified",
    description: "Industry professionals break down complex topics into easy-to-digest lessons.",
  },
  {
    title: "Up-to-Date Content",
    description:
      "Continuously updated courses that align with the latest regulations and industry trends.",
  },
  {
    title: "Accredited & Trusted",
    description:
      "Recognised certifications that add real value to your career and compliance needs.",
  },
];

interface CategoryWhyChooseUsProps {
  image?: string | null;
  categoryName?: string;
}

export function CategoryWhyChooseUs({ image, categoryName }: CategoryWhyChooseUsProps) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1296px] px-4 py-12">
        <h2 className="font-suse text-[32px] font-bold leading-[1.2] text-neutral-900">
          Why Choose Us?
        </h2>
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          {/* Feature list */}
          <div className="flex flex-1 flex-col gap-8">
            {REASONS.map((reason) => (
              <div key={reason.title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0 text-secondary-500" />
                  <span className="font-suse font-semibold text-neutral-900">{reason.title}</span>
                </div>
                <p className="font-open-sans text-[14px] leading-[1.6] text-neutral-500">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>

          {/* Image */}
          <div className="relative hidden shrink-0 overflow-hidden rounded-2xl lg:block lg:h-[312px] lg:w-[526px]">
            {image ? (
              <Image
                src={image}
                alt={categoryName ? `${categoryName} courses` : "Why choose us"}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{ background: "linear-gradient(135deg, #004f65 0%, #00204a 100%)" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
