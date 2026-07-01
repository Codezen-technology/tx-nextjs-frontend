import { bffJson, cartFetch } from "@/lib/api/bff-client";
import { decodeEntities } from "@/lib/api/parsers";

// ─── Billing / Shipping ───────────────────────────────────────────────────────

export interface BillingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string;
  email: string;
  phone?: string;
}

// BillingDetails is the shape BillingForm collects.
export type BillingDetails = BillingAddress;

// ─── Create order ─────────────────────────────────────────────────────────────

export interface CreateOrderPayload {
  billing: BillingAddress;
  shipping?: Partial<BillingAddress>;
  payment_method: string;
  line_items: Array<{ product_id: number; quantity: number }>;
  /** @deprecated Prefer coupon_code + discount_total */
  coupon_lines?: Array<{ code: string }>;
  coupon_code?: string;
  discount_total?: number;
  customer_note?: string;
}

export interface CreateOrderResponse {
  order_id: number;
  order_key: string;
  status: string;
  total: number;
  currency: string;
  client_secret: string | null;
  payment_intent_id: string | null;
}

// ─── WC REST API v3 raw order ─────────────────────────────────────────────────

interface WCLineItemRaw {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  subtotal: string;
  total: string;
  image?: { id: number; src: string };
}

interface WCOrderRaw {
  id: number;
  status: string;
  currency: string;
  total: string;
  subtotal?: string;
  total_tax: string;
  discount_total: string;
  date_created: string;
  order_key: string;
  customer_id: number;
  payment_method: string;
  payment_method_title: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    country: string;
    address_1?: string;
    city?: string;
    postcode?: string;
  };
  line_items: WCLineItemRaw[];
}

// ─── Normalized order detail ──────────────────────────────────────────────────

export interface OrderDetail {
  id: number;
  status: string;
  total: number;
  currency: string;
  date_created: string;
  order_key: string;
  customer_id: number;
  payment_method: string;
  payment_method_title: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    country: string;
    address_1?: string;
    city?: string;
    postcode?: string;
  };
  items: Array<{
    product_id: number;
    name: string;
    quantity: number;
    subtotal: number;
    total: number;
    thumbnail?: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
}

function normalizeWCOrder(raw: WCOrderRaw): OrderDetail {
  return {
    id: raw.id,
    status: raw.status,
    total: parseFloat(raw.total),
    currency: raw.currency,
    date_created: raw.date_created,
    order_key: raw.order_key,
    customer_id: raw.customer_id,
    payment_method: raw.payment_method,
    payment_method_title: raw.payment_method_title,
    billing: raw.billing,
    items: (raw.line_items ?? []).map((li) => ({
      product_id: li.product_id,
      name: li.name,
      quantity: li.quantity,
      subtotal: parseFloat(li.subtotal),
      total: parseFloat(li.total),
      thumbnail: li.image?.src,
    })),
    subtotal: raw.line_items.reduce((s, li) => s + parseFloat(li.subtotal), 0),
    tax: parseFloat(raw.total_tax),
    discount: parseFloat(raw.discount_total),
  };
}

// ─── Payment gateways ─────────────────────────────────────────────────────────

export interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  method_title: string;
  supports: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

// ─── WC Store API order (pay-for-order summary) ───────────────────────────────

interface WCStoreOrderRaw {
  id: number;
  status: string;
  items?: Array<{
    name: string;
    quantity: number;
    totals?: { line_total?: string; line_subtotal?: string };
  }>;
  totals?: {
    total_price?: string;
    total_tax?: string;
    currency_minor_unit?: number;
    currency_symbol?: string;
  };
}

export interface StoreOrderItem {
  name: string;
  quantity: number;
  total: number;
}

export interface StoreOrderSummary {
  id: number;
  status: string;
  currencySymbol: string;
  total: number;
  items: StoreOrderItem[];
}

/** WC Store API amounts are integer strings in the currency's minor unit (e.g. pence). */
function fromMinorUnit(value: string | undefined, minorUnit: number): number {
  return Number(value ?? 0) / 10 ** minorUnit;
}

// ─── WC Store API checkout ────────────────────────────────────────────────────

export type PaymentDataEntry = { key: string; value: string | boolean };

export interface WCStoreCheckoutPayload {
  billing_address: BillingAddress;
  shipping_address?: Partial<BillingAddress>;
  payment_method: string;
  payment_data?: PaymentDataEntry[];
  customer_note?: string;
}

/**
 * `payment_data` for the official WooCommerce Stripe gateway (`stripe`) over the
 * WC Store API, verified against woocommerce-gateway-stripe v10.7.0 + WC core
 * v10.7.0. The contract is non-obvious:
 *
 * WC core (`StoreApi/Legacy.php`) sets `$_POST = $context->payment_data` — i.e.
 * the gateway sees ONLY these entries as `$_POST`. The top-level checkout
 * `payment_method` field selects the gateway but does NOT populate
 * `$_POST['payment_method']`. The UPE gateway derives the payment-method type
 * from `$_POST['payment_method']` (`get_selected_payment_method_type_from_request`):
 * a value of `stripe` ⇒ type `card`. So `payment_method` MUST be repeated here,
 * or the type resolves empty and checkout fails with
 * "The selected payment method type is invalid" (order created, left `failed`).
 *
 * - `payment_method` — the gateway id `stripe`; drives the type derivation.
 * - `wc-stripe-payment-method` — the `pm_…` id (read at `$_POST['wc-stripe-payment-method']`).
 * - `wc_payment_intent_id` — empty for a fresh charge (reused on SCA retry).
 * - `save_payment_method` — `no`; we don't vault cards.
 *
 * Mirrors the keys the plugin's own block checkout JS emits (`build/upe-blocks.js`).
 */
export function stripeCardPaymentData(paymentMethodId: string): PaymentDataEntry[] {
  return [
    { key: "payment_method", value: "stripe" },
    { key: "wc-stripe-payment-method", value: paymentMethodId },
    { key: "wc_payment_intent_id", value: "" },
    { key: "save_payment_method", value: "no" },
  ];
}

/** Read the PaymentIntent client secret from a `requires_action` checkout response. */
export function findClientSecret(
  details: Array<{ key: string; value: string }>,
): string | undefined {
  return details.find((d) => d.key === "payment_intent_secret" || d.key === "client_secret")?.value;
}

export interface WCStoreCheckoutResponse {
  order_id: number;
  status: string;
  order_key: string;
  payment_method: string;
  payment_result: {
    payment_status: "success" | "pending" | "failure" | "requires_action";
    payment_details: Array<{ key: string; value: string }>;
    redirect_url: string;
  };
}

export interface CheckoutSessionResult {
  auto_login: boolean;
  account_exists: boolean;
  email?: string;
  user?: {
    email: string;
    displayName: string;
    nicename: string;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const checkoutService = {
  /** WC Store API checkout — uses WC cart session (Cart-Token). For standard cart flow. */
  wcStoreCheckout: (payload: WCStoreCheckoutPayload) =>
    cartFetch<WCStoreCheckoutResponse>("/api/cart/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** REST v3 order creation — used for Buy Now flow only. */
  createOrder: (payload: CreateOrderPayload) =>
    bffJson<CreateOrderResponse>("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getOrder: async (id: number, orderKey?: string): Promise<OrderDetail> => {
    const qs = orderKey ? `?key=${encodeURIComponent(orderKey)}` : "";
    const raw = await bffJson<WCOrderRaw>(`/api/orders/${id}${qs}`);
    return normalizeWCOrder(raw);
  },

  payOrder: (orderId: number, payment_intent_id: string, order_key?: string) =>
    bffJson<WCOrderRaw>(`/api/orders/${orderId}/pay`, {
      method: "POST",
      body: JSON.stringify({
        payment_intent_id,
        ...(order_key ? { order_key } : {}),
      }),
    }),

  /**
   * Pay an already-created WC order via the WC Store API checkout-order endpoint
   * (`POST /wc/store/v1/checkout/{id}`). Runs the configured Stripe gateway, so the
   * order's status transitions natively. Used by the global order-pay checkout page
   * (B2B licences/subscriptions, and retry-pay for any pending order).
   */
  payOrderViaStore: (
    orderId: number,
    payload: {
      key: string;
      billing_address: BillingAddress;
      shipping_address?: Partial<BillingAddress>;
      payment_method: string;
      payment_data: PaymentDataEntry[];
    },
  ) =>
    cartFetch<WCStoreCheckoutResponse>(`/api/orders/${orderId}/store-pay`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getPaymentGateways: () => bffJson<PaymentGateway[]>("/api/payment-gateways"),

  /**
   * After guest Store API checkout, verify the order key and optionally mint a
   * JWT session (new accounts only). Sets httpOnly cookies via the BFF on auto_login.
   */
  bootstrapCheckoutSession: (orderId: number, orderKey: string) =>
    bffJson<CheckoutSessionResult>("/api/auth/checkout-session", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId, order_key: orderKey }),
    }),

  /** Read an order's line items + totals via the WC Store API (key-authorized, no consumer keys). */
  getStoreOrder: async (orderId: number, key: string): Promise<StoreOrderSummary> => {
    const raw = await bffJson<WCStoreOrderRaw>(
      `/api/orders/${orderId}/store-order?key=${encodeURIComponent(key)}`,
    );
    const minorUnit = raw.totals?.currency_minor_unit ?? 2;
    return {
      id: raw.id,
      status: raw.status,
      currencySymbol: decodeEntities(raw.totals?.currency_symbol ?? "£"),
      total: fromMinorUnit(raw.totals?.total_price, minorUnit),
      items: (raw.items ?? []).map((i) => ({
        name: decodeEntities(i.name),
        quantity: i.quantity,
        total: fromMinorUnit(i.totals?.line_total, minorUnit),
      })),
    };
  },
};
