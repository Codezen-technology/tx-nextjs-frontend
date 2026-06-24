"use client";

import type { LicenceCartItem } from "@/types/business-pricing";

interface OrderRowProps {
  item: LicenceCartItem;
  onQtyChange: (courseId: number, qty: number) => void;
  onRemove: (courseId: number) => void;
}

function OrderRow({ item, onQtyChange, onRemove }: OrderRowProps) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4 text-sm font-medium text-neutral-800">{item.courseName}</td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onQtyChange(item.courseId, Math.max(1, item.qty - 1))}
            className="flex h-7 w-7 items-center justify-center rounded border border-neutral-200 bg-white text-lg leading-none text-neutral-600 hover:bg-neutral-50"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={item.qty}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!Number.isNaN(v) && v >= 1) onQtyChange(item.courseId, v);
            }}
            className="w-12 rounded border border-neutral-200 px-1 py-0.5 text-center text-sm font-semibold [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-[#3F576F]/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => onQtyChange(item.courseId, item.qty + 1)}
            className="flex h-7 w-7 items-center justify-center rounded bg-[#3F576F] text-lg leading-none text-white hover:bg-[#33485d]"
          >
            +
          </button>
        </div>
      </td>
      <td className="whitespace-nowrap py-3 pr-4 text-sm text-neutral-600">
        £{item.pricePerLicence.toFixed(2)}/licence
      </td>
      <td className="whitespace-nowrap py-3 pr-2 text-right text-sm text-neutral-800">
        £{item.lineSubtotal.toFixed(2)}
      </td>
      <td className="py-3 pl-2">
        <button
          type="button"
          onClick={() => onRemove(item.courseId)}
          className="flex h-7 w-7 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-600 hover:text-white"
          aria-label="Remove"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

interface OrderTableProps {
  items: LicenceCartItem[];
  onQtyChange: (courseId: number, qty: number) => void;
  onRemove: (courseId: number) => void;
}

export function OrderTable({ items, onQtyChange, onRemove }: OrderTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 py-12 text-center text-sm text-neutral-400">
        Search for a course above to add it to your order.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs uppercase tracking-wide text-neutral-500">
          <th className="pb-2 pr-4 font-medium">Course</th>
          <th className="pb-2 pr-4 font-medium">Quantity</th>
          <th className="pb-2 pr-4 font-medium">Price</th>
          <th className="pb-2 pr-2 text-right font-medium">Subtotal</th>
          <th className="pb-2 pl-2" />
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <OrderRow key={item.courseId} item={item} onQtyChange={onQtyChange} onRemove={onRemove} />
        ))}
      </tbody>
    </table>
  );
}
