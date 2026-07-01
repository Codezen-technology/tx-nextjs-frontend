import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  CertConfig,
  CertCustomer,
  CertIntent,
  CertQuote,
  CertSelection,
} from "@/types/certificate";

export const certificateService = {
  /** Pricing schema (products/choices/prices/quantities/shipping) from GF form. */
  async getConfig(): Promise<CertConfig> {
    const { data } = await api.get<CertConfig>(endpoints.certificate.config);
    return data;
  },

  /** Authoritative server-priced quote for a selection. */
  async getQuote(selection: CertSelection): Promise<CertQuote> {
    const { data } = await api.post<CertQuote>(endpoints.certificate.quote, selection);
    return data;
  },

  /**
   * Create the Stripe PaymentIntent (BFF route — server prices via /quote and
   * stashes the order in PI metadata). Returns the client secret to confirm.
   */
  async createIntent(input: {
    selection: CertSelection;
    customer: CertCustomer;
  }): Promise<CertIntent> {
    const res = await fetch("/api/certificate/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: input.selection.products,
        shipping: input.selection.shipping,
        customer: input.customer,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as Partial<CertIntent> & { error?: string };
    if (!res.ok || !json.client_secret) {
      throw new Error(json.error ?? "Could not start payment. Please try again.");
    }
    return json as CertIntent;
  },

  /**
   * Confirm a succeeded payment so the server (which re-verifies the PaymentIntent
   * with Stripe) records the GF entry. Best-effort: the webhook is the safety net,
   * so callers shouldn't block the success UI on this.
   */
  async confirm(paymentIntentId: string): Promise<void> {
    await fetch("/api/certificate/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_intent_id: paymentIntentId }),
    });
  },
};
