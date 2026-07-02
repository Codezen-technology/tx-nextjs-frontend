import type { GravityForm, GravityField } from "@/types/form";
import type { SupportIssueSlug } from "@/types/cancellations";

/** Locate the hidden issue_type field in a Support Request GF schema. */
export function findIssueTypeField(form: GravityForm): GravityField | undefined {
  return form.fields.find(
    (field) =>
      field.type === "hidden" &&
      (field.cssClass.includes("issue_type") ||
        field.label.toLowerCase().includes("issue type") ||
        field.label.toLowerCase() === "issue_type"),
  );
}

export function buildIssueTypePrefill(
  form: GravityForm,
  issue: SupportIssueSlug,
): Record<string, string> {
  const field = findIssueTypeField(form);
  if (!field) return {};
  return { [field.name]: issue };
}

export function issueTypeFieldId(form: GravityForm): number | null {
  const field = findIssueTypeField(form);
  return field ? Number(field.id) : null;
}
