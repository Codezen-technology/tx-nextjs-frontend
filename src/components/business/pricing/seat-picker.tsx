"use client";

import type { UpsellHint } from "@/types/business-pricing";
import { UpsellBanner } from "./upsell-banner";

interface SeatPickerProps {
  seatQty: number;
  subBasePrice: number;
  subUpsellHint: UpsellHint | null;
  onSetSeatQty: (qty: number) => void;
}

export function SeatPicker({
  seatQty,
  subBasePrice,
  subUpsellHint,
  onSetSeatQty,
}: SeatPickerProps) {
  const clamp = (v: number) => Math.max(1, Math.min(500, v));

  return (
    <>
      <UpsellBanner hint={subUpsellHint} unit="seat" />

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          How many seats do you need?
        </label>

        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSetSeatQty(clamp(seatQty - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 bg-white text-lg font-bold text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={500}
            value={seatQty}
            onChange={(e) => onSetSeatQty(clamp(parseInt(e.target.value, 10) || 1))}
            className="w-20 [appearance:textfield] rounded-lg border border-neutral-300 px-2 py-2 text-center text-sm font-semibold focus:ring-2 focus:ring-[#3F576F]/30 focus:outline-hidden [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => onSetSeatQty(clamp(seatQty + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 bg-white text-lg font-bold text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            +
          </button>
          <span className="text-sm text-neutral-500">
            × <span className="font-semibold text-neutral-800">£{subBasePrice.toFixed(2)}</span>
            /user/yr
            <span className="ml-1 text-xs">
              (£{(subBasePrice / 12).toFixed(2)}/mo, billed annually)
            </span>
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={500}
          value={seatQty}
          onChange={(e) => onSetSeatQty(parseInt(e.target.value, 10))}
          className="w-full accent-[#3F576F]"
        />
        <div className="mt-1 flex justify-between text-xs text-neutral-400">
          <span>1</span>
          <span>50</span>
          <span>100</span>
          <span>250</span>
          <span>500</span>
        </div>
      </div>
    </>
  );
}
