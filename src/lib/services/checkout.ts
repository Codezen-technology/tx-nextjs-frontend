import { bffJson } from "@/lib/api/bff-client";

export interface BillingDetails {
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  payment_method?: string;
}

export interface CreateOrderResponse {
  order_id: number;
  status: string;
  total: number;
  currency: string;
  client_secret?: string;
  payment_intent_id?: string;
  stripe_error?: string;
}

export interface OrderDetail {
  id: number;
  status: string;
  total: number;
  currency: string;
  date_created: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    country: string;
  };
  items?: Array<{
    product_id: number;
    name: string;
    quantity: number;
    subtotal: number;
    total: number;
    thumbnail: string;
  }>;
  subtotal?: number;
  tax?: number;
  discount?: number;
}

export interface PaymentMethod {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icons: string[];
}

export const checkoutService = {
  createOrder: (billing: BillingDetails) =>
    bffJson<CreateOrderResponse>("/api/orders", {
      method: "POST",
      body: JSON.stringify(billing),
    }),

  getOrder: (id: number) => bffJson<OrderDetail>(`/api/orders/${id}`),

  payOrder: (orderId: number, payment_intent_id: string) =>
    bffJson<OrderDetail>(`/api/orders/${orderId}/pay`, {
      method: "POST",
      body: JSON.stringify({ payment_intent_id }),
    }),

  getPaymentMethods: () => bffJson<PaymentMethod[]>("/api/payment/methods"),
};
