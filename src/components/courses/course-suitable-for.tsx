import { Check } from "lucide-react";
import type { CourseSuitableForItem } from "@/types/course";

interface CourseSuitableForProps {
  heading?: string;
  items: CourseSuitableForItem[];
}

export function CourseSuitableFor({ heading, items }: CourseSuitableForProps) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No information available.</p>;
  }

  return (
    <div className="space-y-4">
      {heading ? <h3 className="text-lg font-bold text-neutral-900">{heading}</h3> : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-100">
              {item.icon ? (
                <img src={item.icon} alt="" className="h-4 w-4 object-contain" loading="lazy" />
              ) : (
                <Check className="h-3 w-3 text-secondary-600" />
              )}
            </span>
            <span className="text-sm text-neutral-700">{item.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
