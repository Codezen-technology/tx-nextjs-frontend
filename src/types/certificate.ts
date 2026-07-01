/**
 * Certificate ordering types (Option C — Stripe-direct).
 * Mirrors the plugin's `/certificate/config` + `/certificate/quote` (sourced from
 * Gravity Form 23) and the BFF `/api/certificate/intent`.
 */

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

export interface CertCustomer {
  full_name: string;
  email: string;
  phone: string;
  course: string;
  notes?: string;
  address?: Record<string, string>;
}

export interface CertIntent {
  client_secret: string;
  payment_intent_id: string;
  total: number;
  total_minor: number;
  currency: string;
}
