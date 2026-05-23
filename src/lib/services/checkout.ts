import { bffJson } from "@/lib/api/bff-client";

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
  coupon_lines?: Array<{ code: string }>;
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

export const checkoutService = {
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

  getPaymentGateways: () => bffJson<PaymentGateway[]>("/api/payment-gateways"),
};
