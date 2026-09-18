"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { stripePromise } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { certificateService } from "@/lib/services/certificate";
import { CouponError, formsService } from "@/lib/services/forms";
import {
  GfField,
  FieldShell,
  FIELD_CLASS,
  LABEL_CLASS,
  SECTION_CLASS,
} from "@/components/gf-fields";
import { queryKeys } from "@/lib/utils/query-keys";
import {
  DEFAULT_CERT_PRODUCT,
  type CertConfig,
  type CertProduct,
  type CertProductSlug,
  type CertSelection,
} from "@/types/certificate";
import type { AppliedCoupon } from "@/types/form";

const STRIPE_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      color: "#0d2b53",
      fontFamily: "Open Sans, sans-serif",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#dc2626" },
  },
} as const;

function money(currency: string, amount: number) {
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${symbol}${amount.toFixed(2)}`;
}

/** GF field types that render no input (display/structure only). */
const NON_INPUT_TYPES = new Set(["html", "section", "page"]);

export interface CertificateFormProps {
  /**
   * Which certificate offer to sell — the plugin's product slug. Route-level
   * constant, never user input: each page passes its own literal. Drives the
   * config/quote/intent requests, so it must match the page's copy or the visitor
   * is charged for another offer.
   */
  product?: CertProductSlug;
}

export function CertificateForm({ product = DEFAULT_CERT_PRODUCT }: CertificateFormProps = {}) {
  if (!stripePromise) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Online payment is not available right now. Please try again later.
      </p>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <CertificateFormInner product={product} />
    </Elements>
  );
}

function CertificateFormInner({ product }: { product: CertProductSlug }) {
  const stripe = useStripe();
  const elements = useElements();

  const {
    data: config,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.certificate.config(product),
    queryFn: () => certificateService.getConfig(product),
    staleTime: 5 * 60_000,
  });

  // Selection keyed by product field id, plus shipping + customer.
  const [choices, setChoices] = useState<Record<string, { choice: string; qty: number }>>({});
  const [shipping, setShipping] = useState<string>("");
  // Dynamic GF field values, keyed by input name (input_6, input_78_1, …).
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  // Coupons the backend accepted. Only ever written from an apply response — the
  // app never decides a code is valid, and never computes what it is worth.
  const [coupons, setCoupons] = useState<AppliedCoupon[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-selection, in the order that matters:
  //
  //  1. the visitor's own choice, once they make one;
  //  2. Gravity Forms' own default (`isSelected` — the tick in its Choices editor),
  //     so this page opens on the same option, and the same total, as the form
  //     WordPress renders. That tick is what admins edit against;
  //  3. otherwise the £0 "I don't need…" option, which satisfies the GF-required
  //     product field at record time and lets the visitor upgrade from there.
  //
  // A group with no GF default and no £0 option is genuinely required and is left
  // UNSELECTED — never defaulted to a priced choice the visitor did not pick.
  // Derived (not stored in state) to avoid setState-in-effect — `choices` only
  // holds the user's overrides.
  const effectiveChoices = useMemo(() => {
    const out: Record<string, { choice: string; qty: number }> = {};
    if (!config) return out;
    // `group`, not `product` — `product` is the offer slug this form is selling.
    for (const group of config.products) {
      const override = choices[group.fieldId];
      if (override) {
        out[group.fieldId] = override;
        continue;
      }

      const gfDefault = group.choices.find((c) => c.isSelected);
      if (gfDefault) {
        out[group.fieldId] = { choice: gfDefault.value, qty: 1 };
        continue;
      }

      const zero = group.choices.find((c) => c.price === 0);
      if (!groupIsRequired(group) && zero) {
        out[group.fieldId] = { choice: zero.value, qty: 1 };
      }
    }
    return out;
  }, [config, choices]);

  const couponCodes = useMemo(() => coupons.map((c) => c.code), [coupons]);

  // Codes live in the selection, so applying or removing one re-keys the quote
  // cache and re-prices the PaymentIntent exactly like changing a product does.
  const selection: CertSelection = useMemo(
    () => ({ products: effectiveChoices, shipping: shipping || null, coupons: couponCodes }),
    [effectiveChoices, shipping, couponCodes],
  );

  // A selection missing a required group is unpriceable, and the backend says so
  // with a 400 (`lms_cert_invalid_selection`). On `/hardcopy-certificate` that is
  // the *initial* state — the hardcopy group has no £0 option to default to — so
  // quoting eagerly would fire a known-invalid request on mount and on every
  // keystroke until the visitor picks one. Wait until it can be answered.
  const selectionIsPriceable = useMemo(() => {
    if (!config) return false;
    return config.products.every(
      (g) => !groupIsRequired(g) || Boolean(effectiveChoices[g.fieldId]?.choice),
    );
  }, [config, effectiveChoices]);

  const { data: quote, error: quoteError } = useQuery({
    queryKey: queryKeys.certificate.quote(product, selection),
    queryFn: () => certificateService.getQuote(product, selection),
    enabled: selectionIsPriceable,
    staleTime: 0,
    // A coupon refused at quote time is an answer, not a blip: retrying would only
    // repeat it, and the message is what the buyer needs to read.
    retry: false,
  });

  const currency = config?.currency ?? "GBP";
  const total = quote?.total ?? 0;
  const discount = quote?.discount ?? 0;

  // The quote re-checks every applied code, so a code that expired mid-session
  // surfaces here rather than as a silent full-price total.
  const quoteMessage =
    quoteError instanceof Error && quoteError.message ? quoteError.message : null;

  /** Discount the backend attributed to a code, when the quote reported one. */
  function discountFor(code: string): number | undefined {
    return quote?.coupons?.find((c) => c.code === code)?.discount;
  }

  const setField = (name: string, value: string) =>
    setFieldValues((prev) => ({ ...prev, [name]: value }));

  // Derive the buyer's email + name from the dynamic GF fields — for the intent's
  // email requirement, Stripe billing_details, and the confirmation email.
  const emailField = config?.fields.find((f) => f.type === "email");
  const nameField =
    config?.fields.find((f) => f.type === "name") ??
    config?.fields.find((f) => f.type === "text" && /name/i.test(f.label));
  const contactEmail = emailField ? (fieldValues[emailField.name] ?? "") : "";
  const contactName = nameField ? (fieldValues[nameField.name] ?? "") : "";

  function firstMissingRequired(): string | null {
    if (!config) return null;
    // Product groups with no £0 opt-out are required and are not pre-selected.
    for (const group of config.products) {
      if (groupIsRequired(group) && !effectiveChoices[group.fieldId]?.choice) {
        return `${group.label || "This option"} is required.`;
      }
    }
    for (const f of config.fields) {
      if (!f.isRequired || NON_INPUT_TYPES.has(f.type) || f.inputs?.length) continue;
      if (!(fieldValues[f.name] ?? "").trim()) return `${f.label || "This field"} is required.`;
    }
    if (!contactEmail.trim()) return "Email is required.";
    return null;
  }

  function update(productId: number, patch: Partial<{ choice: string; qty: number }>) {
    setChoices((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? effectiveChoices[productId] ?? { choice: "", qty: 1 }),
        ...patch,
      },
    }));
  }
  function isPriced(productId: number, productChoices: CertProduct["choices"]) {
    const sel = effectiveChoices[productId]?.choice;
    return productChoices.find((c) => c.value === sel && c.price > 0);
  }

  /**
   * Ask the backend whether a code may be applied. Returns the refusal text to
   * show, or null when it was accepted — the caller owns the input's own state.
   *
   * The codes already applied go up with it so Gravity Forms can judge stacking;
   * the selection goes up only so the response can carry totals, and is never a
   * price we assert.
   */
  async function applyCoupon(code: string): Promise<string | null> {
    if (!config) return "Coupons are unavailable right now.";
    try {
      const result = await formsService.applyCoupon(config.form_id, {
        code,
        applied: couponCodes,
        selection,
      });
      setCoupons((prev) => [...prev.filter((c) => c.code !== result.coupon.code), result.coupon]);
      return null;
    } catch (err) {
      // A refusal carries Gravity Forms' own reason ("expired", "can't be used in
      // conjunction with…"); anything else is a transport or service failure and
      // must not be reported as if the code were bad.
      if (err instanceof CouponError) return err.message;
      return err instanceof Error && err.message
        ? err.message
        : "Could not apply that code. Please try again.";
    }
  }

  async function handlePay() {
    setError(null);
    const missing = firstMissingRequired();
    if (missing) {
      setError(missing);
      return;
    }
    if (!quote || quote.total_minor <= 0) {
      setError("Please select at least one certificate option.");
      return;
    }
    if (!stripe || !elements) {
      setError("Payment is still loading. Please wait a moment.");
      return;
    }
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setError("Card field not found.");
      return;
    }

    setSubmitting(true);
    try {
      const intent = await certificateService.createIntent({
        product,
        selection,
        fields: fieldValues,
        contact: { email: contactEmail, name: contactName },
      });

      const result = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: contactName || undefined,
            email: contactEmail || undefined,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Payment failed. Please check your card details.");
      }
      if (result.paymentIntent?.status === "succeeded") {
        // Server-verified recording (no webhook needed locally). Best-effort — the
        // webhook is the backup, and /certificate/record is idempotent.
        await certificateService.confirm(result.paymentIntent.id).catch(() => {});
        setDone(true);
        return;
      }
      throw new Error("Payment could not be completed. Please try again.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading certificate options…
      </div>
    );
  }
  // Fails closed by construction: a non-default product is addressed by path
  // (`/certificate/hardcopy/config`), so a plugin that does not serve it answers
  // 404 and lands here rather than returning the other offer's prices.
  if (isError || !config) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Certificate ordering is unavailable right now.
      </p>
    );
  }
  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h3 className="font-suse mt-4 text-2xl font-bold text-neutral-900">Payment confirmed</h3>
        <p className="font-open-sans mt-2 text-sm text-neutral-600">
          Thank you, {contactName.split(" ")[0] || "there"}. Your certificate order is confirmed —
          we&apos;ve emailed your receipt and will be in touch shortly.
        </p>
      </div>
    );
  }

  const shippableIds = shippableProductIds(config);

  return (
    <div className="space-y-8">
      {/* ── Product selection ───────────────────────────────────────── */}
      <div className="space-y-6">
        {config.products.map((product) => (
          <ProductGroup
            key={product.fieldId}
            product={product}
            selectedChoice={effectiveChoices[product.fieldId]?.choice ?? ""}
            qty={effectiveChoices[product.fieldId]?.qty ?? 1}
            onChoice={(v) => update(product.fieldId, { choice: v })}
            onQty={(q) => update(product.fieldId, { qty: q })}
            showQty={
              Boolean(isPriced(product.fieldId, product.choices)) && Boolean(product.quantity)
            }
          />
        ))}

        {config.shipping && shippableChosen(config, shippableIds, effectiveChoices) && (
          <fieldset className="space-y-2">
            <legend className={cn("text-sm font-medium", LABEL_CLASS)}>
              {config.shipping.label}
            </legend>
            <select
              className={FIELD_CLASS}
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
            >
              <option value="">Select shipping…</option>
              {config.shipping.choices.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} ({money(currency, c.price)})
                </option>
              ))}
            </select>
          </fieldset>
        )}
      </div>

      {/* ── Coupon ──────────────────────────────────────────────────── */}
      {config.coupon && (
        <CouponBox
          label={config.coupon.label}
          currency={currency}
          applied={coupons}
          discountFor={discountFor}
          // Disabled only once a quote has actually come back at £0 — there is
          // nothing for a code to discount, the backend would refuse it, and each
          // attempt spends one of the visitor's rate-limited tries. While a quote
          // is still in flight the total is unknown, so the box stays usable
          // rather than flickering disabled on every selection change.
          disabled={quote ? quote.total_minor <= 0 : false}
          onApply={applyCoupon}
          onRemove={(code) => setCoupons((prev) => prev.filter((c) => c.code !== code))}
        />
      )}

      {/* ── Total ───────────────────────────────────────────────────── */}
      <div className="bg-secondary-50 border-secondary-500 space-y-2 rounded-lg border px-4 py-3">
        {discount > 0 && (
          <>
            <div className="font-open-sans flex items-center justify-between text-sm text-neutral-600">
              <span>Subtotal</span>
              <span>{money(currency, (quote?.subtotal ?? 0) + (quote?.shipping ?? 0))}</span>
            </div>
            <div className="font-open-sans flex items-center justify-between text-sm text-green-700">
              <span>Discount</span>
              <span>−{money(currency, discount)}</span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between">
          <span className="font-suse text-base font-semibold text-neutral-900">Total Fee</span>
          <span className="font-suse text-primary-600 text-xl font-bold">
            {money(currency, total)}
          </span>
        </div>
      </div>

      {quoteMessage && <p className="text-sm text-red-600">{quoteMessage}</p>}

      {/* ── Dynamic GF fields (name / email / phone / course / address / notes) ── */}
      <div className="space-y-4">
        {config.fields.map((field) => (
          <GfField key={field.id} field={field} values={fieldValues} onChange={setField} />
        ))}
      </div>

      {/* ── Payment ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className={SECTION_CLASS}>Payment</h3>
        <FieldShell label="Card number" required>
          <div className={cn(FIELD_CLASS, "flex items-center")}>
            <CardNumberElement options={STRIPE_ELEMENT_OPTIONS} className="w-full" />
          </div>
        </FieldShell>
        <div className="grid grid-cols-2 gap-4">
          <FieldShell label="Expiry date" required>
            <div className={cn(FIELD_CLASS, "flex items-center")}>
              <CardExpiryElement options={STRIPE_ELEMENT_OPTIONS} className="w-full" />
            </div>
          </FieldShell>
          <FieldShell label="Security code" required>
            <div className={cn(FIELD_CLASS, "flex items-center")}>
              <CardCvcElement options={STRIPE_ELEMENT_OPTIONS} className="w-full" />
            </div>
          </FieldShell>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={handlePay} disabled={submitting} className="w-full" size="lg">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Pay {money(currency, total)}
      </Button>
      <p className="font-open-sans text-center text-xs text-neutral-400">
        Secure payment by Stripe. Your card details never touch our servers.
      </p>
    </div>
  );
}

/**
 * Coupon code box: input + Apply, then the accepted codes with what each took off.
 *
 * Deliberately stateless about validity — `onApply` resolves to the backend's
 * refusal text or null, and this component only decides where to put it. Any
 * client-side "looks like a code" check here would eventually disagree with
 * Gravity Forms and tell a buyer to retype something that would have worked.
 */
function CouponBox({
  label,
  currency,
  applied,
  discountFor,
  disabled = false,
  onApply,
  onRemove,
}: {
  label: string;
  currency: string;
  applied: AppliedCoupon[];
  discountFor: (code: string) => number | undefined;
  /** True when the order has nothing to discount yet. */
  disabled?: boolean;
  onApply: (code: string) => Promise<string | null>;
  onRemove: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply() {
    if (disabled) return;
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter a coupon code.");
      return;
    }
    setBusy(true);
    setError(null);
    const refusal = await onApply(trimmed);
    setBusy(false);
    if (refusal) {
      setError(refusal);
      return;
    }
    setCode("");
  }

  return (
    <div className="space-y-2">
      <label className={cn("block text-sm font-medium", LABEL_CLASS)} htmlFor="cert-coupon">
        {label || "Coupon"}
      </label>
      <div className="flex items-start gap-2">
        <input
          id="cert-coupon"
          type="text"
          className={cn(FIELD_CLASS, "uppercase", disabled && "cursor-not-allowed opacity-60")}
          value={code}
          disabled={busy || disabled}
          autoComplete="off"
          onChange={(e) => setCode(e.target.value)}
          // Enter inside a coupon box means "apply this code", never "submit and
          // pay" — the surrounding form would otherwise take the keypress.
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void apply();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy || disabled}
          onClick={() => void apply()}
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Apply
        </Button>
      </div>

      {disabled && (
        <p className="font-open-sans text-sm text-neutral-500">
          Select a certificate option before applying a coupon.
        </p>
      )}

      {error && !disabled && <p className="text-sm text-red-600">{error}</p>}

      {applied.length > 0 && (
        <ul className="space-y-1">
          {applied.map((coupon) => {
            const off = discountFor(coupon.code);
            return (
              <li
                key={coupon.code}
                className="font-open-sans flex items-center justify-between gap-2 text-sm text-neutral-700"
              >
                <span>
                  <span className="font-semibold">{coupon.code}</span>
                  {coupon.name ? ` — ${coupon.name}` : ""}
                  {off != null ? ` (−${money(currency, off)})` : ""}
                </span>
                <button
                  type="button"
                  className="text-xs text-neutral-500 underline hover:text-neutral-800"
                  onClick={() => onRemove(coupon.code)}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ProductGroup({
  product,
  selectedChoice,
  qty,
  onChoice,
  onQty,
  showQty,
}: {
  product: CertProduct;
  selectedChoice: string;
  qty: number;
  onChoice: (v: string) => void;
  onQty: (q: number) => void;
  showQty: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-neutral-800">{product.label}</legend>
      <div className="space-y-2">
        {product.choices.map((c) => (
          <label
            key={c.value}
            className="font-open-sans flex items-center gap-2 text-sm text-neutral-700"
          >
            <input
              type="radio"
              name={product.name}
              value={c.value}
              className="h-4 w-4 [color-scheme:light]"
              checked={selectedChoice === c.value}
              onChange={() => onChoice(c.value)}
            />
            <span>
              {c.label}
              {c.price > 0 ? "" : ""}
            </span>
          </label>
        ))}
      </div>
      {showQty && product.quantity && (
        <div className="flex items-center gap-2 pt-1">
          <span className="shrink-0 text-sm text-neutral-600">How many</span>
          <select
            className={cn(FIELD_CLASS, "w-24 py-2")}
            value={qty}
            onChange={(e) => onQty(Number(e.target.value))}
          >
            {product.quantity.options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}
    </fieldset>
  );
}

/**
 * Whether a product group demands a choice.
 *
 * The plugin computes this ("required when the group offers no zero-priced choice")
 * and sends it as `required`; the local derivation is the same rule, kept only for
 * plugin builds that predate the field.
 */
function groupIsRequired(group: CertProduct): boolean {
  return group.required ?? !group.choices.some((c) => c.price === 0);
}

/** Product labels that denote physical goods, used only as a backend fallback. */
const PHYSICAL_LABEL = /hard\s*copy|printed/i;

/**
 * Which products make shipping applicable.
 *
 * Prefers the backend's `shipping.appliesTo` (mirrors the Gravity Form's own
 * conditional logic). Falls back to matching the product label, because array
 * position is not a reliable signal: the hardcopy product is `products[1]` on
 * form 23 but `products[0]` on form 22. The final positional fallback preserves
 * the pre-product behaviour for any form that matches neither.
 */
export function shippableProductIds(config: CertConfig): number[] {
  if (config.shipping?.appliesTo?.length) return config.shipping.appliesTo;

  const byLabel = config.products.filter((p) => PHYSICAL_LABEL.test(p.label));
  if (byLabel.length > 0) return byLabel.map((p) => p.fieldId);

  const positional = config.products[1];
  return positional ? [positional.fieldId] : [];
}

/** A shippable product chosen with a priced (non-"I don't need") option. */
export function shippableChosen(
  config: CertConfig,
  shippableIds: number[],
  choices: Record<string, { choice: string; qty: number }>,
): boolean {
  return shippableIds.some((id) => {
    const product = config.products.find((p) => p.fieldId === id);
    if (!product) return false;
    const sel = choices[id]?.choice;
    return product.choices.some((c) => c.value === sel && c.price > 0);
  });
}
