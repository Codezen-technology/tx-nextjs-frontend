import type { Page } from "@playwright/test";

/**
 * Put a purchasable course in the guest cart.
 *
 * The guest cart is keyed by a WooCommerce Store API `Cart-Token`, which the app
 * keeps in localStorage (`wc-cart-token`) and sends as `x-cart-token` — not by a
 * cookie. A bare fetch therefore creates a cart the page never sees: the POST
 * succeeds, the page reads its own empty cart, and a cart-dependent route
 * bounces. So the token has to be bootstrapped and stored the way the app stores
 * it.
 *
 * Extracted so `/cart` and `/checkout` seed identically. A second copy of this
 * would drift the moment one of them changed.
 *
 * Returns false when the backend has no course with a product behind it, so the
 * caller can skip rather than fail on missing fixture data.
 */
export async function seedGuestCart(page: Page): Promise<boolean> {
  const wpBase = process.env.NEXT_PUBLIC_WP_API_URL ?? "http://localhost";
  await page.goto("/all-courses");

  return page.evaluate(async (base) => {
    const TOKEN_KEY = "wc-cart-token";
    const NONCE_KEY = "wc-cart-nonce";

    // Bootstrap a cart token, exactly as cartFetch() does before any write.
    const bootstrap = await fetch("/api/cart", { credentials: "include" });
    const bt = bootstrap.headers.get("x-cart-token");
    const bn = bootstrap.headers.get("x-wc-store-api-nonce");
    if (bt) {
      localStorage.setItem(TOKEN_KEY, bt);
      localStorage.setItem(NONCE_KEY, bn ?? "");
    }

    // Public course reads go straight to WP, so the browser can ask it directly
    // for a course with a WooCommerce product behind it.
    const list = await fetch(`${base}/wp-json/lms-backend/v1/courses?per_page=30`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    const items = list?.data?.items ?? list?.items ?? [];
    const course = items.find(
      (c: Record<string, unknown>) =>
        Number(c.product_id ?? (c.pricing as Record<string, unknown>)?.product_id ?? 0) > 0,
    );
    if (!course) return false;
    const productId = Number(
      course.product_id ?? (course.pricing as Record<string, unknown>)?.product_id,
    );

    const added = await fetch("/api/cart/items", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-cart-token": localStorage.getItem(TOKEN_KEY) ?? "",
        "x-wc-store-api-nonce": localStorage.getItem(NONCE_KEY) ?? "",
      },
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });
    const newToken = added.headers.get("x-cart-token");
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(NONCE_KEY, added.headers.get("x-wc-store-api-nonce") ?? "");
    }
    return added.ok;
  }, wpBase);
}
