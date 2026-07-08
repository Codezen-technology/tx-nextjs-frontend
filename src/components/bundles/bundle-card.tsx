import { cn } from "@/lib/utils/cn";
import type { Bundle } from "@/types/bundle";
import { ArrowRight, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BundleCardProps {
  bundle: Bundle;
  className?: string;
}

export function BundleCard({ bundle, className }: BundleCardProps) {
  const { pricing } = bundle;
  const showStrike =
    pricing.regularPrice != null && pricing.price != null && pricing.regularPrice > pricing.price;
  const preview = bundle.coursesPreview.slice(0, 5);
  const extra = bundle.includedCoursesCount - preview.length;

  return (
    <div
      className={cn(
        "group border-neutral-30 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-xs transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Link href={`/bundles/${bundle.slug}`} className="block shrink-0">
        <div className="bg-neutral-20 relative aspect-19/10 w-full overflow-hidden">
          {bundle.image?.large || bundle.image?.full ? (
            <Image
              src={(bundle.image.large ?? bundle.image.full) as string}
              alt={bundle.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="bg-neutral-20 flex h-full items-center justify-center text-neutral-100">
              <Layers className="h-10 w-10" />
            </div>
          )}
          <span className="bg-primary-500 absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white">
            <Layers className="h-3 w-3" />
            {bundle.includedCoursesCount} courses
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <Link href={`/bundles/${bundle.slug}`}>
          <h3 className="font-suse hover:text-secondary-500 line-clamp-2 text-lg leading-snug font-bold text-neutral-900 transition-colors">
            {bundle.title}
          </h3>
        </Link>

        {preview.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm text-neutral-200">
            {preview.map((c) => (
              <li key={c.id} className="line-clamp-1">
                • {c.title}
              </li>
            ))}
            {extra > 0 && (
              <li className="font-semibold text-neutral-500">and {extra} more courses</li>
            )}
          </ul>
        )}

        <div className="border-secondary-100 mt-auto flex items-center justify-between border-t border-dashed pt-4">
          <div className="flex items-baseline gap-2">
            {pricing.price != null ? (
              <span className="font-open-sans font-bold text-neutral-900">
                <span className="text-xl">£{pricing.price}</span>
              </span>
            ) : null}
            {showStrike ? (
              <span className="font-open-sans text-sm text-[#dc3545] line-through">
                £{pricing.regularPrice}
              </span>
            ) : null}
          </div>
          <Link
            href={`/bundles/${bundle.slug}`}
            className="border-secondary-500 text-secondary-500 group-hover:border-primary-600 group-hover:bg-primary-500 inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm transition-colors group-hover:text-white"
          >
            View Bundle <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function BundleCardSkeleton() {
  return (
    <div className="border-neutral-30 flex flex-col overflow-hidden rounded-2xl border bg-white">
      <div className="bg-neutral-20 aspect-19/10 w-full animate-pulse" />
      <div className="flex flex-col gap-3 p-5">
        <div className="bg-neutral-20 h-5 w-3/4 animate-pulse rounded" />
        <div className="bg-neutral-20 h-4 w-full animate-pulse rounded" />
        <div className="bg-neutral-20 h-4 w-2/3 animate-pulse rounded" />
        <div className="border-secondary-100 mt-2 flex items-center justify-between border-t border-dashed pt-4">
          <div className="bg-neutral-20 h-6 w-20 animate-pulse rounded" />
          <div className="bg-neutral-20 h-8 w-28 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}
