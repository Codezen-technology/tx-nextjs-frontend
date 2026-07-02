interface SupportSidebarProps {
  variant?: "support" | "refund";
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

export function SupportSidebar({ variant = "support" }: SupportSidebarProps) {
  const steps = variant === "refund" ? REFUND_STEPS : SUPPORT_STEPS;

  return (
    <aside className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <p className="font-open-sans text-xs font-semibold uppercase tracking-wide text-secondary-500">
          {variant === "support" ? "High priority" : "Refund review"}
        </p>
        <h3 className="mt-2 font-suse text-lg font-bold text-neutral-900">Response time</h3>
        <p className="mt-2 font-open-sans text-sm text-neutral-600">Same working day</p>
        {variant === "support" ? (
          <p className="mt-3 font-open-sans text-xs leading-relaxed text-neutral-500">
            This route is for problems we can usually fix without making you wait for a refund
            review.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-suse text-lg font-bold text-neutral-900">Our commitment</h3>
        <ul className="mt-4 space-y-3 font-open-sans text-sm text-neutral-600">
          <li>Every request is read by a real person, not an automated reply.</li>
          <li>
            We check the account, order, and course details before recommending the next step.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-suse text-lg font-bold text-neutral-900">What happens next</h3>
        <ol className="mt-4 space-y-4">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3 font-open-sans text-sm text-neutral-600">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-suse text-xs font-bold text-primary-700">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
