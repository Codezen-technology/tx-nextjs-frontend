"use client";

import { useState } from "react";
import { GravityForm } from "@/components/forms/gravity-form";
import { RefundSuccess } from "@/components/cancellations/support-success";
import type { GravityForm as GravityFormSchema } from "@/types/form";

interface RefundRequestFormProps {
  form: GravityFormSchema | null;
  formId: number | null;
}

export function RefundRequestForm({ form, formId }: RefundRequestFormProps) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <RefundSuccess />;
  }

  if (!formId || !form) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 font-open-sans text-sm text-amber-900">
        The refund form is not configured yet. Please email us at{" "}
        <a href="mailto:hi@trainingexcellence.org.uk" className="font-semibold underline">
          hi@trainingexcellence.org.uk
        </a>{" "}
        with your order details and we will review your request.
      </div>
    );
  }

  return (
    <GravityForm form={form} suppressDefaultConfirmation onSuccess={() => setSubmitted(true)} />
  );
}
