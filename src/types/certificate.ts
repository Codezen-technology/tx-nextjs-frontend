/**
 * Certificate ordering types (Option C — Stripe-direct).
 * Mirrors the plugin's `/certificate/config` + `/certificate/quote` (sourced from
 * Gravity Form 23) and the BFF `/api/certificate/intent`.
 */
import type { GravityField } from "./form";

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
}

export interface CertShipping {
  fieldId: number;
  name: string;
  label: string;
  choices: CertChoice[];
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
 * Editable `/certificate` page content (hero, order section, sidebar promo banner)
 * from `GET /certificate/page`. Sourced from ACF — empty/null fields mean "use the
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
  hero: {
    heading: string;
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
