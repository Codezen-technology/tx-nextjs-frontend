import { ShieldCheck } from "lucide-react";
import { CardBrandMarks } from "./CardBrandMarks";

export function SecurePaymentBadge() {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1fb356]">
        <ShieldCheck size={16} />
        Guaranteed safe &amp; secure checkout
      </div>
      {/* Brand marks, not text labels — QA-CHECK-A3. This list used to be five
          hard-coded strings including JCB, which the design does not carry. */}
      <CardBrandMarks />
    </div>
  );
}
