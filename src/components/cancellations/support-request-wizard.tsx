"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GravityForm } from "@/components/forms/gravity-form";
import { IssueTypePicker } from "@/components/cancellations/issue-type-picker";
import { SupportSidebar } from "@/components/cancellations/support-sidebar";
import { SupportSuccess } from "@/components/cancellations/support-success";
import { SUPPORT_ISSUE_BY_SLUG, isSupportIssueSlug } from "@/lib/constants/support-issues";
import { buildIssueTypePrefill, issueTypeFieldId } from "@/lib/utils/support-form";
import type { SupportIssueSlug } from "@/types/cancellations";
import type { GravityForm as GravityFormSchema } from "@/types/form";

interface SupportRequestWizardProps {
  form: GravityFormSchema | null;
  formId: number | null;
}

export function SupportRequestWizard({ form, formId }: SupportRequestWizardProps) {
  const searchParams = useSearchParams();
  const issueParam = searchParams.get("issue");

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIssue, setSelectedIssue] = useState<SupportIssueSlug | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isSupportIssueSlug(issueParam)) {
      setSelectedIssue(issueParam);
      setStep(2);
    }
  }, [issueParam]);

  const issue = selectedIssue ? SUPPORT_ISSUE_BY_SLUG[selectedIssue] : null;
  const hiddenIssueFieldId = form ? issueTypeFieldId(form) : null;

  function handleSelect(slug: SupportIssueSlug) {
    setSelectedIssue(slug);
    setStep(2);
  }

  if (submitted) {
    return <SupportSuccess />;
  }

  if (!formId || !form) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 font-open-sans text-sm text-amber-900">
        The support form is not configured yet. Please email us at{" "}
        <a href="mailto:hi@trainingexcellence.org.uk" className="font-semibold underline">
          hi@trainingexcellence.org.uk
        </a>{" "}
        and we will help you directly.
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <p className="font-open-sans text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Step {step} of 2
        </p>

        {step === 1 ? (
          <div className="mt-4">
            <h2 className="font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
              What do you need help with?
            </h2>
            <p className="mt-3 font-open-sans text-sm text-neutral-600">
              Pick the closest match. The form adapts so you do not have to explain everything from
              scratch.
            </p>

            <div className="mt-8">
              <IssueTypePicker selected={selectedIssue} onSelect={handleSelect} />
            </div>

            <p className="mt-6 font-open-sans text-sm text-neutral-500">
              <Link
                href="/cancellations#refund-form"
                className="font-semibold text-secondary-500 underline hover:text-secondary-600"
              >
                None of these apply — continue to refund request
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-4">
            {issue ? (
              <div className="mb-8 rounded-xl border border-primary-100 bg-primary-50 p-5">
                <p className="font-open-sans text-xs font-semibold uppercase tracking-wide text-primary-600">
                  How we fix this
                </p>
                <p className="mt-2 font-open-sans text-sm leading-relaxed text-neutral-700">
                  {issue.fixCopy}
                </p>
              </div>
            ) : null}

            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
                Tell us where to reply
              </h2>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="shrink-0 font-open-sans text-sm font-semibold text-secondary-500 hover:underline"
              >
                Change issue
              </button>
            </div>

            {selectedIssue ? (
              <GravityForm
                form={form}
                prefillValues={buildIssueTypePrefill(form, selectedIssue)}
                hideFieldIds={hiddenIssueFieldId ? [hiddenIssueFieldId] : []}
                suppressDefaultConfirmation
                onSuccess={() => setSubmitted(true)}
              />
            ) : null}

            <p className="mt-4 font-open-sans text-xs text-neutral-500">
              Reviewed personally by our team — same working day
            </p>
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <SupportSidebar variant="support" />
      </div>
    </div>
  );
}
