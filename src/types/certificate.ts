/**
 * Certificate ordering types (Option C — Stripe-direct).
 * Mirrors the plugin's product-scoped `/certificate/{product}/config` +
 * `/certificate/{product}/quote` and the BFF `/api/certificate/intent`.
 */
import type { GravityField } from "./form";

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

export interface CertConfig {
  form_id: number;
  record_form_id: number;
  currency: string;
  products: CertProduct[];
  shipping: CertShipping | null;
  /** Non-pricing GF fields (name/email/phone/course/address/notes/…) — render dynamically. */
  fields: GravityField[];
}

/** Selection keyed by product field id. */
export interface CertSelection {
  products: Record<string, { choice: string; qty: number }>;
  shipping: string | null;
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
  };
}
