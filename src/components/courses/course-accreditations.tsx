import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import type { CourseAccreditation } from "@/types/course";

interface CourseAccreditationsProps {
  accreditations: CourseAccreditation[];
}

export function CourseAccreditations({ accreditations }: CourseAccreditationsProps) {
  if (!accreditations.length) {
    return (
      <p className="text-sm text-muted-foreground">No accreditation information available.</p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-neutral-900">Training You Can Trust</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accreditations.map((acc) => (
          <div
            key={acc.slug}
            className="flex flex-col items-center gap-3 rounded-lg border border-[#ebedf1] bg-white p-5 text-center shadow-sm"
          >
            {isRenderableImageSrc(acc.logo) ? (
              <div className="relative h-16 w-32">
                <SafeImage
                  src={acc.logo}
                  alt={acc.label}
                  fill
                  sizes="128px"
                  className="object-contain"
                />
              </div>
            ) : null}
            <h4 className="font-semibold text-neutral-900 text-sm">{acc.label}</h4>
            {acc.description ? (
              <p className="text-xs text-neutral-600 leading-relaxed">{acc.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
