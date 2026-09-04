export interface LicenceCourseItem {
  id: number;
  name: string;
  featured_image?: string;
  price_per_licence: number;
}

export interface LicenceCartItem {
  courseId: number;
  courseName: string;
  qty: number;
  pricePerLicence: number;
  lineSubtotal: number;
}

export interface LicenceOrderSummary {
  total_qty: number;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  discounted_total: number;
  vat: number;
  total: number;
  savings: number;
}

export interface LicencePricingTier {
  id?: number;
  min_qty: number;
  discount_percent: number;
}

export interface LicencePricingConfig {
  tiers: LicencePricingTier[];
  vat_enabled: boolean;
  vat_rate: number;
  vat_label: string;
  default_price: number;
  subscription_price: number;
}

export interface UpsellHint {
  next_tier_qty: number;
  next_discount: number;
  qty_needed: number;
}

export interface LicenceCheckoutResult {
  order_id?: number;
  /** Order key — required to pay the order via the WC Store API checkout-order endpoint. */
  order_key?: string;
  pay_url?: string;
  checkout_url?: string;
}

export interface BusinessSubscriptionItem {
  id: number;
  plan_type: string;
  status: string;
  end_date?: string;
  total_seats?: number;
  assigned_seats?: number;
  available_seats?: number;
}

/** `GET /businesses/subscriptions/active` — seats summed across active subscriptions. */
export interface AggregatedActiveSubscription {
  subscription_id?: number;
  plan_type?: string;
  status?: string;
  total_seats: number;
  assigned_seats: number;
  available_seats: number;
  next_payment?: string | null;
}

export interface QuoteRequestPayload {
  type: "licence" | "subscription";
  items?: Array<{ course_id: number; qty: number }>;
  qty?: number;
  name: string;
  email: string;
  message?: string;
}

export type PricingTab = "licence" | "subscription";
