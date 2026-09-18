/**
 * Certificate ordering types (Option C — Stripe-direct).
 * Mirrors the plugin's product-scoped `/certificate/{product}/config` +
 * `/certificate/{product}/quote` and the BFF `/api/certificate/intent`.
 */
import type { AppliedCoupon, GravityField } from "./form";

/**
 * Which certificate offer a request is for — the plugin's *product slug*.
 *
 * Each slug resolves server-side to its own Gravity Forms (`default` → display
 * form 23, `hardcopy` → display form 22) plus that product's record form and txn
 * field. The form ids stay in the plugin: a slug is an allowlist by construction,
 * whereas a raw form id in the URL would let a caller price against any form on
 * the site.
 *
 * Named "slug" rather than "product" because `CertProduct` below already means a
 * product *group within* a form (field 69, field 51, …) — a different thing.
 *
 * @see docs/HARDCOPY_CERTIFICATE_API.md
 */
export const CERT_PRODUCT_SLUGS = ["default", "hardcopy"] as const;

export type CertProductSlug = (typeof CERT_PRODUCT_SLUGS)[number];

export const DEFAULT_CERT_PRODUCT: CertProductSlug = "default";

/** Narrow arbitrary input to a known product slug. Anything unrecognised is rejected. */
export function isCertProductSlug(value: unknown): value is CertProductSlug {
  return typeof value === "string" && (CERT_PRODUCT_SLUGS as readonly string[]).includes(value);
}

export interface CertChoice {
  value: string;
  label: string;
  price: number;
  priceMinor: number;
  /**
   * Gravity Forms' own default for this choice — the tick in the field's Choices
   * editor. The page must open on it, or it shows a different pre-selection (and a
   * different opening total) than the same form rendered by WordPress, which is
   * what admins edit against.
   *
   * Optional: plugin builds before this was exposed omit it, and the client falls
   * back to the £0 opt-out.
   */
  isSelected?: boolean;
}

export interface CertQuantity {
  fieldId: number;
  name: string;
  options: number[];
  conditional: boolean;
}

export interface CertProduct {
  fieldId: number;
  name: string;
  label: string;
  choices: CertChoice[];
  quantity: CertQuantity | null;
  /**
   * Whether a choice must be made. The plugin sets this when the group offers no
   * zero-priced choice — `/hardcopy-certificate`'s hardcopy group has no "I don't
   * need…" option, so it is required and must not be defaulted to a priced choice.
   *
   * Optional: older plugin builds omit it, so callers fall back to the same rule.
   */
  required?: boolean;
}

export interface CertShipping {
  fieldId: number;
  name: string;
  label: string;
  choices: CertChoice[];
  /**
   * Product field ids that make shipping applicable (i.e. the physical goods).
   * Mirrors the Gravity Form's conditional logic on the shipping field.
   *
   * Optional because the plugin does not send it yet; when absent the frontend
   * identifies the physical product by label. Relying on array position is wrong —
   * the hardcopy product is `products[1]` on form 23 but `products[0]` on form 22.
   */
  appliesTo?: number[];
}

/**
 * The form's coupon field, when it has one and the Coupons add-on is active.
 *
 * The backend sends null in every other case — including "the add-on is inactive",
 * which is why this is the only thing the UI should branch on: a box whose Apply
 * could never succeed is worse than no box.
 */
export interface CertCouponField {
  fieldId: number;
  name: string;
  label: string;
}

export interface CertConfig {
  form_id: number;
  record_form_id: number;
  currency: string;
  products: CertProduct[];
  shipping: CertShipping | null;
  /** Coupon field to render, or null/absent when this form takes no coupons. */
  coupon?: CertCouponField | null;
  /** Non-pricing GF fields (name/email/phone/course/address/notes/…) — render dynamically. */
  fields: GravityField[];
}

/** Selection keyed by product field id. */
export interface CertSelection {
  products: Record<string, { choice: string; qty: number }>;
  shipping: string | null;
  /**
   * Coupon codes the backend has accepted.
   *
   * Part of the selection rather than a sibling argument on purpose: the selection
   * is the quote's cache key, the quote request body and the intent payload, so a
   * code added here re-prices everything that already reacts to a selection change.
   * Keeping them apart is how a quote ends up discounted while the charge is not.
   */
  coupons?: string[];
}

export interface CertQuoteItem {
  fieldId: number;
  label: string;
  price: number;
  qty: number;
  line: number;
}

export interface CertQuote {
  available: boolean;
  currency: string;
  items: CertQuoteItem[];
  subtotal: number;
  shipping: number;
  /** Coupons the backend applied. Absent on plugin builds without coupon support. */
  coupons?: AppliedCoupon[];
  /** Money the coupons took off. Absent (treat as 0) on those same builds. */
  discount?: number;
  /** Already net of `discount` — display this, never a locally recomputed figure. */
  total: number;
  total_minor: number;
}

/** Dynamic GF field values keyed by input name (input_6, input_78_1, …). */
export type CertFieldValues = Record<string, string>;

/** Derived contact for the intent's email requirement + confirmation email. */
export interface CertContact {
  email: string;
  name: string;
}

export interface CertIntent {
  client_secret: string;
  payment_intent_id: string;
  total: number;
  total_minor: number;
  currency: string;
}

/**
 * Editable certificate page content (hero, order section, sidebar promo banner)
 * from `GET /certificate/{product}/page`. Sourced from ACF — empty/null fields mean "use the
 * static fallback" (see certificate/page.tsx). Only fields the Figma design
 * actually renders are typed here — the API returns more (trustBadges,
 * accreditationBanner, formId, txnFieldId, hero.eyebrow/text) but the frontend
 * doesn't consume them.
 */
export interface CertImage {
  url: string;
  alt: string;
}

export interface CertPageContent {
  /**
   * Product slug this content is for, when the plugin declares it. The endpoint is
   * addressed by path, so the response already belongs to the requested product and
   * this is only a consistency check — content that names a *different* slug is
   * discarded in favour of the static defaults.
   */
  product?: CertProductSlug;
  hero: {
    heading: string;
    /** Supporting line under the heading. Rendered by `/hardcopy-certificate`,
     *  where the H1 is the page name and this carries the value proposition. */
    text?: string;
    benefits: string[];
    images: CertImage[];
  };
  orderSection: {
    heading: string;
  };
  promoBanner: {
    image: CertImage | null;
    heading: string;
    /**
     * Where the banner points, as authored in the CMS ("Link URL (optional)").
     * Normalised by the service: a backend-origin URL becomes a site path, and
     * anything that is not an http(s) URL or a site path becomes `""` — an
     * editor can type into this field, so it is never trusted raw.
     *
     * Empty/absent means the banner is a picture, not a link.
     */
    link?: string;
  };
}
