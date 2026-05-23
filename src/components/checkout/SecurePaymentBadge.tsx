import { ShieldCheck } from "lucide-react";

export function SecurePaymentBadge() {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1fb356]">
        <ShieldCheck size={16} />
        Guaranteed safe &amp; secure checkout
      </div>
      <div className="flex items-center gap-2">
        {/* Payment method icons — text labels as fallback */}
        {["VISA", "MC", "AMEX", "DISC", "JCB"].map((label) => (
          <div
            key={label}
            className="flex h-7 w-11 items-center justify-center rounded border border-gray-200 bg-white text-[9px] font-bold tracking-wide text-gray-500"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
