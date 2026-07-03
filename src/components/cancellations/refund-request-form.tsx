"use client";

import { useState } from "react";
import { GravityForm, type FormLayoutGroup } from "@/components/forms/gravity-form";
import { FormUnavailableMessage } from "@/components/cancellations/form-unavailable-message";
import { RefundSuccess } from "@/components/cancellations/support-success";
import type { GravityForm as GravityFormSchema } from "@/types/form";

/** GF field ids — must match Cancellations_Forms_Installer refund_form_definition(). */
const REFUND_LAYOUT: FormLayoutGroup[] = [
  { type: "grid", columns: 2, fieldIds: [2, 3] },
  { type: "grid", columns: 2, fieldIds: [4, 6] },
  { type: "divider", label: "Request details" },
  { type: "stack", fieldIds: [5, 7, 8, 9, 10, 13] },
];

interface RefundRequestFormProps {
  form: GravityFormSchema | null;
  formId: number | null;
  supportEmail?: string | null;
}

export function RefundRequestForm({ form, formId, supportEmail }: RefundRequestFormProps) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <RefundSuccess />;
  }

  if (!formId || !form) {
    return <FormUnavailableMessage supportEmail={supportEmail} formLabel="refund form" />;
  }

  return (
    <GravityForm
      form={form}
      variant="cancellations"
      layoutGroups={REFUND_LAYOUT}
      showPrivacyLink
      fallbackEmail={supportEmail}
      surfaceClass="bg-white"
      suppressDefaultConfirmation
      onSuccess={() => setSubmitted(true)}
    />
  );
}
