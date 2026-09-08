import { bffJson } from "@/lib/api/bff-client";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import {
  DEFAULT_CERT_PRODUCT,
  type CertConfig,
  type CertContact,
  type CertFieldValues,
  type CertIntent,
  type CertPageContent,
  type CertQuote,
  type CertSelection,
  type CertProductSlug,
} from "@/types/certificate";

/**
 * Cache tag for a product's page content. Scoped so revalidating one offer's
 * content does not bust the other's.
 */
function pageTag(product: CertProductSlug): string {
  return product === DEFAULT_CERT_PRODUCT ? "certificate-page" : `certificate-page-${product}`;
}

/** `?product=` for the BFF, omitted for the default so existing URLs are unchanged. */
function productQuery(product: CertProductSlug): string {
  return product === DEFAULT_CERT_PRODUCT ? "" : `?product=${encodeURIComponent(product)}`;
}

export const certificateService = {
  /**
   * Editable page content (hero/trust badges/accreditation banner/order section/
   * promo banner) — Server Component only, uses `serverFetch` for Next.js caching.
   */
  async getPage(product: CertProductSlug = DEFAULT_CERT_PRODUCT): Promise<CertPageContent> {
    return serverFetch<CertPageContent>(endpoints.certificate.page(product), {
      revalidate: 3600,
      tags: [pageTag(product)],
    });
  },

  /**
   * Pricing schema (products/choices/prices/quantities/shipping) from GF form.
   *
   * Goes through the BFF, not browser-direct to WP: the WP host serves a
   * SiteGround anti-bot captcha (HTML, HTTP 202, no CORS headers) to browser
   * XHR, which fails as a CORS error on the live domain.
   */
  async getConfig(product: CertProductSlug = DEFAULT_CERT_PRODUCT): Promise<CertConfig> {
    return bffJson<CertConfig>(`/api/certificate/config${productQuery(product)}`);
  },

  /** Authoritative server-priced quote for a selection (BFF, see `getConfig`). */
  async getQuote(product: CertProductSlug, selection: CertSelection): Promise<CertQuote> {
    return bffJson<CertQuote>("/api/certificate/quote", {
      method: "POST",
      body: JSON.stringify({ product, ...selection }),
    });
  },

  /**
   * Create the Stripe PaymentIntent (BFF route — server prices via /quote and
   * stashes the order in PI metadata). Returns the client secret to confirm.
   */
  async createIntent(input: {
    product?: CertProductSlug;
    selection: CertSelection;
    fields: CertFieldValues;
    contact: CertContact;
  }): Promise<CertIntent> {
    const res = await fetch("/api/certificate/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: input.product ?? DEFAULT_CERT_PRODUCT,
        products: input.selection.products,
        shipping: input.selection.shipping,
        fields: input.fields,
        contact: input.contact,
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
