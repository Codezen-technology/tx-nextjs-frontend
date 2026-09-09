import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * The card brands the checkout page claims to accept — QA-CHECK-A3.
 *
 * One list, because there were two: the secure-payment badge showed five text
 * labels including JCB, the payment-method row showed four, and the design
 * (`6239:134680`) carries these four and no JCB. A brand mark is a claim about
 * what the gateway takes, so it is not something two components should each
 * hold their own opinion about.
 *
 * The marks are the frame's own exports, committed rather than referenced: the
 * Figma asset URLs expire after about a week, and brand marks are trademarks
 * with exact geometry that must not be approximated by hand.
 */
export const CARD_BRANDS = [
  { name: "American Express", src: "/icons/payment/amex.svg", inChip: false },
  { name: "Discover", src: "/icons/payment/discover.svg", inChip: false },
  { name: "Mastercard", src: "/icons/payment/mastercard.svg", inChip: false },
  // Visa exports as the bare wordmark; the frame draws it on a white chip.
  { name: "Visa", src: "/icons/payment/visa.svg", inChip: true },
] as const;

export function CardBrandMarks({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {CARD_BRANDS.map((brand) => (
        <span
          key={brand.name}
          className={cn(
            // 43 × 28 — the frame's mark box.
            "flex h-7 w-[43px] items-center justify-center overflow-hidden",
            brand.inChip && "border-neutral-30 rounded-[2px] border bg-white",
          )}
        >
          <Image
            src={brand.src}
            alt={brand.name}
            width={brand.inChip ? 34 : 43}
            height={brand.inChip ? 11 : 28}
            className="object-contain"
          />
        </span>
      ))}
    </div>
  );
}
