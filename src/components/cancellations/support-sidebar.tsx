import { PriorityBadge } from "@/components/cancellations/priority-badge";
import { cn } from "@/lib/utils/cn";

interface SupportSidebarProps {
  variant?: "support" | "refund";
  className?: string;
}

const SUPPORT_STEPS = [
  "We receive your request and route it to the right team member.",
  "A team member checks your account, order, and course access.",
  "We email you with a fix, a question, or the next best option.",
];

const REFUND_STEPS = [
  "A team member reviews your request and checks your account.",
  "We contact you by email with a resolution or to ask any follow-up questions.",
  "If a refund is approved, it's processed within 1–3 working days to your original payment method.",
];

function SidebarPanel({
  label,
  title,
  children,
}: {
  label?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      {label ? (
        <p className="font-open-sans text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          {label}
        </p>
      ) : null}
      {title ? (
        <h3 className={cn("font-suse text-lg font-bold text-neutral-900", label && "mt-1")}>
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}

export function SupportSidebar({ variant = "support", className }: SupportSidebarProps) {
  const steps = variant === "refund" ? REFUND_STEPS : SUPPORT_STEPS;

  return (
    <aside className={cn("space-y-6", className)}>
      <SidebarPanel label="Response time">
        {variant === "support" ? (
          <div className="mb-3">
            <PriorityBadge />
          </div>
        ) : null}
        <p className="font-open-sans text-sm font-medium text-neutral-800">Same working day</p>
        {variant === "support" ? (
          <p className="mt-3 font-open-sans text-xs leading-relaxed text-neutral-500">
            This route is for problems we can usually fix without making you wait for a refund
            review.
          </p>
        ) : null}
      </SidebarPanel>

      <SidebarPanel label="Our commitment">
        <div className="mt-1 space-y-3 font-open-sans text-sm leading-relaxed text-neutral-600">
          <p>Every request is read by a real person, not an automated reply.</p>
          <p>We check the account, order, and course details before recommending the next step.</p>
        </div>
      </SidebarPanel>

      <SidebarPanel label="What happens next">
        <ol className="mt-3 space-y-4">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3 font-open-sans text-sm text-neutral-600">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-suse text-xs font-bold text-primary-700">
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
