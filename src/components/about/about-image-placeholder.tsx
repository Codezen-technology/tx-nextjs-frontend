import { cn } from "@/lib/utils/cn";

/** Shown in place of an unset About-page ACF image field. */
export function AboutImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "from-primary-50 to-primary-100 flex items-center justify-center bg-linear-to-br",
        className,
      )}
    >
      <span className="font-suse text-primary-300 px-4 text-center text-sm font-bold">{label}</span>
    </div>
  );
}
