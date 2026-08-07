import Link from "next/link";
import { Button } from "@/components/ui/button";

const SUCCESS_STEPS = [
  "A team member reviews your request and checks your account.",
  "We contact you by email with a resolution or to ask any follow-up questions.",
  "If a refund is needed, it's processed within 1–3 working days to your original payment method.",
];

function SuccessSteps() {
  return (
    <ol className="mt-4 space-y-4">
      {SUCCESS_STEPS.map((step, i) => (
        <li key={step} className="font-open-sans flex gap-3 text-sm text-neutral-600">
          <span className="bg-primary-100 font-suse text-primary-700 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {i + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}

export function SupportSuccess() {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-8 md:p-10">
      <h2 className="font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
        Request received
      </h2>
      <p className="font-open-sans mt-3 text-sm leading-relaxed text-neutral-600">
        Your request has been routed for review. We will check the account details and email you
        with the next step.
      </p>
      <p className="font-open-sans mt-4 text-sm font-semibold text-neutral-800">
        Expected response: same working day
      </p>

      <div className="mt-8">
        <h3 className="font-suse text-lg font-bold text-neutral-900">What happens next</h3>
        <SuccessSteps />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild className="bg-secondary-500 hover:bg-secondary-600 text-white">
          <Link href="/all-courses">Browse all courses</Link>
        </Button>
        <Button asChild variant="outline" className="border-neutral-300 bg-white">
          <Link href="/">Return to homepage</Link>
        </Button>
      </div>
    </div>
  );
}

export function RefundSuccess() {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-8 md:p-10">
      <h2 className="font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
        Request received
      </h2>
      <p className="font-open-sans mt-3 text-sm leading-relaxed text-neutral-600">
        Your request is with the team. We will review the details and contact you by email with the
        next step.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild className="bg-secondary-500 hover:bg-secondary-600 text-white">
          <Link href="/all-courses">Browse all courses</Link>
        </Button>
        <Button asChild variant="outline" className="border-neutral-300 bg-white">
          <Link href="/">Return to homepage</Link>
        </Button>
      </div>
    </div>
  );
}
