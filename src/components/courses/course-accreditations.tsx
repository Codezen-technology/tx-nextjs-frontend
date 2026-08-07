import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import type { CourseAccreditation } from "@/types/course";

interface CourseAccreditationsProps {
  accreditations: CourseAccreditation[];
}

export function CourseAccreditations({ accreditations }: CourseAccreditationsProps) {
  if (!accreditations.length) {
    return (
      <p className="font-open-sans text-sm text-neutral-500">
        No accreditation information available.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900 sm:text-[38px]">
        Training you can trust
      </h2>
      <div className="border-neutral-30 space-y-4 rounded-lg border bg-white p-6">
        {accreditations.map((acc) => (
          <div
            key={acc.slug}
            className="border-neutral-30 flex flex-col gap-4 border-b pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-start"
          >
            <div className="border-neutral-30 bg-neutral-10 flex h-[108px] w-full shrink-0 items-center justify-center rounded-lg border sm:w-[152px]">
              {isRenderableImageSrc(acc.logo) ? (
                <SafeImage
                  src={acc.logo}
                  alt={acc.label}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              ) : (
                <span className="font-open-sans px-2 text-center text-xs font-semibold text-neutral-600">
                  {acc.label}
                </span>
              )}
            </div>
            <div className="bg-neutral-10 min-w-0 flex-1 rounded-lg p-4">
              <h3 className="font-open-sans text-base font-semibold text-neutral-900">
                {acc.label}
              </h3>
              {acc.description ? (
                <p className="font-open-sans mt-2 text-sm leading-relaxed text-neutral-600">
                  {acc.description}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
