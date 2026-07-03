"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { GravityForm } from "@/components/forms/gravity-form";
import { FormUnavailableMessage } from "@/components/cancellations/form-unavailable-message";
import { IssueTypePicker } from "@/components/cancellations/issue-type-picker";
import { SupportSidebar } from "@/components/cancellations/support-sidebar";
import { SupportSuccess } from "@/components/cancellations/support-success";
import { SUPPORT_FORM_LAYOUT, SUPPORT_TRUST_LINE } from "@/lib/constants/support-form-layout";
import { SUPPORT_ISSUE_BY_SLUG, isSupportIssueSlug } from "@/lib/constants/support-issues";
import { buildIssueTypePrefill, issueTypeFieldId } from "@/lib/utils/support-form";
import type { SupportIssueSlug } from "@/types/cancellations";
import type { GravityForm as GravityFormSchema } from "@/types/form";

interface SupportRequestWizardProps {
  form: GravityFormSchema | null;
  formId: number | null;
  supportEmail?: string | null;
}

export function SupportRequestWizard({ form, formId, supportEmail }: SupportRequestWizardProps) {
  const router = useRouter();
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
    router.replace(`/support-request?issue=${slug}`, { scroll: false });
  }

  function handleChangeIssue() {
    setStep(1);
    setSelectedIssue(null);
    router.replace("/support-request", { scroll: false });
  }

  if (submitted) {
    return (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SupportSuccess />
        <SupportSidebar variant="support" className="lg:sticky lg:top-28 lg:self-start" />
      </div>
    );
  }

  if (!formId || !form) {
    return <FormUnavailableMessage supportEmail={supportEmail} formLabel="support form" />;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div aria-live="polite" className="space-y-6">
        {step === 2 && issue ? (
          <div className="rounded-xl border border-primary-100 bg-primary-50/80 p-5 duration-200 animate-in fade-in">
            <p className="flex items-center gap-2 font-open-sans text-xs font-semibold uppercase tracking-wide text-primary-600">
              How we fix this
            </p>
            <p className="mt-2 font-open-sans text-sm leading-relaxed text-neutral-700">
              {issue.fixCopy}
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-neutral-30 bg-white p-6 shadow-sm md:p-8">
          {step === 1 ? (
            <div className="duration-200 animate-in fade-in">
              <p className="font-open-sans text-xs font-semibold uppercase tracking-widest text-primary-500">
                Step 1 of 2
              </p>
              <h2 className="mt-4 font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
                What do you need help with?
              </h2>
              <p className="mt-3 font-open-sans text-sm leading-relaxed text-neutral-600">
                Pick the closest match. The form adapts so you do not have to explain everything
                from scratch.
              </p>

              <div className="mt-8">
                <IssueTypePicker selected={selectedIssue} onSelect={handleSelect} />
              </div>

              <p className="mt-8 border-t border-neutral-30 pt-6 font-open-sans text-sm text-neutral-500">
                <Link
                  href="/cancellations?refund=1#refund-form"
                  className="font-semibold text-secondary-500 underline hover:text-secondary-600"
                >
                  None of these apply — continue to refund request →
                </Link>
              </p>
            </div>
          ) : (
            <div className="duration-200 animate-in fade-in">
              <button
                type="button"
                onClick={handleChangeIssue}
                className="-ml-1 inline-flex items-center gap-1 rounded font-open-sans text-sm font-semibold text-neutral-500 transition-colors hover:text-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Change issue
              </button>

              <p className="mt-4 font-open-sans text-xs font-semibold uppercase tracking-widest text-primary-500">
                Step 2 of 2
              </p>
              <h2 className="mt-2 font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
                {issue?.replyHeading ?? "Tell us where to reply"}
              </h2>

              {selectedIssue ? (
                <div className="mt-8">
                  <GravityForm
                    form={form}
                    variant="cancellations"
                    layoutGroups={SUPPORT_FORM_LAYOUT}
                    prefillValues={buildIssueTypePrefill(form, selectedIssue)}
                    hideFieldIds={hiddenIssueFieldId ? [hiddenIssueFieldId] : []}
                    showPrivacyLink
                    fallbackEmail={supportEmail}
                    footerNote={SUPPORT_TRUST_LINE}
                    suppressDefaultConfirmation
                    onSuccess={() => setSubmitted(true)}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <SupportSidebar variant="support" className="lg:sticky lg:top-28 lg:self-start" />
    </div>
  );
}
