import type { FormLayoutGroup } from "@/components/forms/gravity-form";

/** GF field ids — must match Cancellations_Forms_Installer support_form_definition(). */
export const SUPPORT_FORM_LAYOUT: FormLayoutGroup[] = [
  { type: "grid", columns: 2, fieldIds: [2, 3] },
  { type: "stack", fieldIds: [4] },
  { type: "divider", label: "Issue details" },
  { type: "remaining", excludeFieldIds: [1, 2, 3, 4] },
];

export const SUPPORT_TRUST_LINE = "Reviewed personally by our team — same working day";
