import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface RefundSidebarProps {
  className?: string;
}

function SidebarPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <p className="font-open-sans text-[10px] font-semibold tracking-widest text-neutral-400 uppercase">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function RefundSidebar({ className }: RefundSidebarProps) {
  return (
    <aside className={cn("space-y-6", className)}>
      <SidebarPanel label="Before you submit">
        <h3 className="font-suse text-lg font-bold text-neutral-900">
          A quick fix may still be faster.
        </h3>
        <p className="font-open-sans mt-2 text-sm leading-relaxed text-neutral-600">
          Login problems, wrong course, and duplicate purchase checks are usually solved through
          support first.
        </p>
        <Link
          href="/support-request"
          className="border-primary-200 bg-primary-50 font-open-sans text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-400 mt-4 inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          Get help →
        </Link>
      </SidebarPanel>

      <SidebarPanel label="Past the standard window?">
        <p className="font-open-sans text-sm leading-relaxed text-neutral-600">
          Requests outside the standard window are still considered and reviewed on a case-by-case
          basis.
        </p>
      </SidebarPanel>

      <SidebarPanel label="What happens next">
        <ol className="space-y-4">
          {[
            "A team member reviews your refund request.",
            "If approved, refund processed within 1–3 working days to your original payment method.",
          ].map((step, i) => (
            <li key={step} className="font-open-sans flex gap-3 text-sm text-neutral-600">
              <span className="bg-primary-100 font-suse text-primary-700 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </SidebarPanel>
    </aside>
  );
}
