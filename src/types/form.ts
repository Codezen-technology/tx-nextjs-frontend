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
  /**
   * Gravity Forms' own on/off switch for the rule set — the API sends it, and a
   * disabled block still carries its rules. Optional because not every field
   * serialises it. Observed on certificate form 22's shipping field.
   */
  enabled?: boolean;
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
  /**
   * True when the form carries a Gravity Forms Coupons field.
   *
   * Optional: a plugin build without coupon support omits it, and the coupon box
   * is simply not rendered — the app and the plugin deploy independently.
   */
  hasCoupon?: boolean;
  /** Field id of that coupon field; codes post back as `input_{couponFieldId}`. */
  couponFieldId?: number | null;
  isMultiPage: boolean;
  pageCount: number;
  fields: GravityField[];
}

/**
 * A coupon the backend accepted, as `POST /forms/{id}/coupons` reports it.
 *
 * `amount` is the coupon's configured value (10 means £10 for a flat coupon, 10%
 * for a percentage one) and is NOT the money taken off — that is `discount`, which
 * only a priced quote can know. Never compute one from the other here: the backend
 * applies flat coupons before percentage ones and discounts the shipping-inclusive
 * total, and a second implementation of that would eventually disagree with the
 * amount actually charged.
 */
export interface AppliedCoupon {
  code: string;
  name: string;
  /** `flat` | `percentage` — Gravity Forms' own vocabulary. */
  type: string;
  amount: number;
  can_stack?: boolean;
  /** Money this coupon took off, present only where the response carried totals. */
  discount?: number;
}

/** Successful response of `POST /forms/{id}/coupons`. */
export interface CouponApplyResult {
  coupon: AppliedCoupon;
  /** Every code now applied, including the one just accepted. */
  applied: string[];
  field: { id: number; name: string };
  /** Server-priced totals — null unless the request carried a priceable selection. */
  totals: CouponTotals | null;
}

/** Totals a coupon response may carry; shaped by the backend's quote. */
export interface CouponTotals {
  currency: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  total_minor: number;
  coupons: AppliedCoupon[];
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
