import { cn } from "@/lib/utils/cn";

/**
 * The green "you are saving" chip.
 *
 * Shared because the purchase card and the bulk table sit next to each other on
 * the Individual tab: when each owned its own hex pair they drifted to two
 * different greens on the same screen.
 */
export function SavingsPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full bg-[#eaf2ec] px-2 py-0.5 text-[12px] leading-4 font-bold text-[#4f9254]",
        className,
      )}
    >
      {children}
    </span>
  );
}
