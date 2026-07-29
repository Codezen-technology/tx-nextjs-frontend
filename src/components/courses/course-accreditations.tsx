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
      <h2 className="font-suse text-[32px] leading-[1.2] font-medium text-neutral-900">
        Training you can trust
      </h2>
      <div className="bg-secondary-50 space-y-4 rounded-lg p-6">
        {accreditations.map((acc) => (
          <div
            key={acc.slug}
            className="border-neutral-30 flex flex-col gap-4 border-b pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-start"
          >
            <div className="flex h-27 w-full shrink-0 items-center justify-center rounded-lg bg-white sm:w-38">
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
            <div className="border-secondary-500 min-w-0 flex-1 border-l py-4 pr-4 pl-4">
              <h3 className="font-open-sans text-base font-bold text-black">{acc.label}</h3>
              {acc.description ? (
                <p className="font-open-sans mt-2 text-sm leading-relaxed font-normal text-black">
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
