/**
 * Display-price helpers.
 *
 * The `lms-backend/v1/home` and `/pricing` payloads carry two shapes of price:
 * a numeric `product.price` (present when the plan is wired to a WooCommerce
 * product) and a pre-formatted display string such as `"£29"` or `"£49.00"`
 * (always present, and the only shape production currently returns). A
 * quantity stepper has to scale whichever one it is given, so these helpers
 * cover both.
 */

/** Currency symbol + numeric amount + decimal places, parsed out of a WP display string. */
export interface ParsedPrice {
  /** Everything before the first digit — usually `£`. */
  symbol: string;
  /** The numeric value, thousands separators removed. */
  amount: number;
  /** Decimal places the source string used, so scaling round-trips visually. */
  decimals: number;
  /** Everything after the numeric part — e.g. `" /mo"`. */
  suffix: string;
}

const PRICE_RE = /^([^\d-]*)(-?[\d,]*\.?\d+)([\s\S]*)$/;

/** Parses `"£1,299.00"` → `{ symbol: "£", amount: 1299, decimals: 2, suffix: "" }`. */
export function parseDisplayPrice(display: string): ParsedPrice | null {
  const match = PRICE_RE.exec(display.trim());
  if (!match) return null;

  const [, symbol, numeric, suffix] = match;
  const amount = Number.parseFloat(numeric.replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;

  const decimals = numeric.includes(".") ? (numeric.split(".")[1]?.length ?? 0) : 0;
  return { symbol, amount, decimals, suffix };
}

/** Formats an amount back into the shape its source string used. */
export function formatLikeDisplayPrice(parsed: ParsedPrice, amount: number): string {
  const body = amount.toLocaleString("en-GB", {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });
  return `${parsed.symbol}${body}${parsed.suffix}`;
}

/**
 * Multiplies a formatted price string by `quantity`, preserving the currency
 * symbol, decimal places and any trailing unit. Returns the input untouched
 * when it cannot be parsed — a wrong-looking total is worse than an unscaled
 * one, and unparsable strings here mean "Contact us"-style copy.
 */
export function scaleDisplayPrice(display: string | undefined, quantity: number): string {
  if (!display) return "";
  if (!Number.isFinite(quantity) || quantity <= 1) return display;

  const parsed = parseDisplayPrice(display);
  if (!parsed) return display;

  return formatLikeDisplayPrice(parsed, parsed.amount * quantity);
}

/**
 * Preferred line total for a plan: the numeric product price when the plan is
 * wired to WooCommerce, otherwise the scaled display string. Keeping this in
 * one place stops the header total and the cart line from drifting apart.
 */
export function planLineTotal(
  display: string | undefined,
  numericUnitPrice: number | null | undefined,
  currency: string | undefined,
  quantity: number,
): string {
  if (typeof numericUnitPrice === "number" && Number.isFinite(numericUnitPrice)) {
    const total = numericUnitPrice * quantity;
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency || "GBP",
        // Whole-pound plans are quoted without decimals on the live site.
        minimumFractionDigits: Number.isInteger(total) ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(total);
    } catch {
      return `£${Number.isInteger(total) ? total : total.toFixed(2)}`;
    }
  }

  return scaleDisplayPrice(display, quantity);
}
