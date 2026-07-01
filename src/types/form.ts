/**
 * Gravity Forms schema + submission types.
 *
 * Mirrors the backend `Form_Model::to_schema()` (lms-backend/v1 forms bridge).
 * See the plugin's docs/GRAVITY_FORMS_API.md.
 */

export interface GravityChoice {
  text: string;
  value: string;
  isSelected: boolean;
  /** Present on pricing/product/option choices. */
  price?: string;
}

/** Sub-input of a composite field (name / address / checkbox). */
export interface GravityInput {
  /** Composite id, e.g. "44.3". */
  id: string;
  label: string;
  placeholder: string;
  /** POST key the client must send, e.g. "input_44_3". */
  name: string;
}

/** One condition inside a field's conditional logic. */
export interface ConditionalRule {
  /** id of the field this rule depends on. */
  fieldId: string | number;
  operator:
    | "is"
    | "isnot"
    | "greater_than"
    | "less_than"
    | "contains"
    | "starts_with"
    | "ends_with"
    | string;
  value: string;
}

/** GF conditional logic: show/hide a field based on other fields' values. */
export interface ConditionalLogic {
  actionType: "show" | "hide";
  logicType: "all" | "any";
  rules: ConditionalRule[];
}

export interface GravityField {
  /** Field id as a string, e.g. "6". */
  id: string;
  type: string;
  label: string;
  isRequired: boolean;
  placeholder: string;
  description: string;
  defaultValue: string;
  cssClass: string;
  size: string;
  pageNumber: number;
  errorMessage: string;
  /** POST key for plain fields, e.g. "input_6". */
  name: string;
  maxLength?: number;
  /** Present for `html` fields. */
  content?: string;
  choices?: GravityChoice[];
  inputs?: GravityInput[];
  conditionalLogic?: ConditionalLogic | null;
  // ── fileupload ──
  multipleFiles?: boolean;
  allowedExtensions?: string[];
  /** Max size per file, in MB. */
  maxFileSize?: number;
  maxFiles?: number;
  // ── page break (type === "page") ──
  nextButton?: { text: string };
  previousButton?: { text: string };
}

export interface GravityForm {
  id: number;
  title: string;
  description: string;
  button: { text: string };
  /** True when the form takes payment (Stripe/product/total) — not submittable here. */
  hasPayment: boolean;
  isMultiPage: boolean;
  pageCount: number;
  fields: GravityField[];
}

/** Validation messages keyed by field id (e.g. { "6": "This field is required." }). */
export type FormFieldErrors = Record<string, string>;

export interface FormSubmissionSuccess {
  entry_id: number;
  confirmation_type: "message" | "redirect";
  confirmation_message?: string;
  confirmation_redirect?: string;
  resume_token?: string;
}

/** Flat submission payload keyed by GF input name (input_6, input_44_3, …). */
export type FormValues = Record<string, unknown>;
