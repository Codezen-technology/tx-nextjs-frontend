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
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default each product to its £0 "I don't need…" option so the GF-required
  // product fields are satisfied at record time; the user upgrades from there.
  //
  // A product with no £0 option is genuinely required and is left UNSELECTED —
  // never defaulted to a priced choice. `/hardcopy-certificate`'s hardcopy field
  // is exactly this: defaulting would silently pre-add £19.99 to the order.
  // Derived (not stored in state) to avoid setState-in-effect — `choices` only
  // holds the user's overrides.
  const effectiveChoices = useMemo(() => {
    const out: Record<string, { choice: string; qty: number }> = {};
    if (!config) return out;
    // `group`, not `product` — `product` is the offer slug this form is selling.
    for (const group of config.products) {
      const zero = group.choices.find((c) => c.price === 0);
      const override = choices[group.fieldId];
      if (override) {
        out[group.fieldId] = override;
      } else if (!groupIsRequired(group) && zero) {
        out[group.fieldId] = { choice: zero.value, qty: 1 };
      }
    }
    return out;
  }, [config, choices]);

  const selection: CertSelection = useMemo(
    () => ({ products: effectiveChoices, shipping: shipping || null }),
    [effectiveChoices, shipping],
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

  const { data: quote } = useQuery({
    queryKey: queryKeys.certificate.quote(product, selection),
    queryFn: () => certificateService.getQuote(product, selection),
    enabled: selectionIsPriceable,
    staleTime: 0,
  });

  const currency = config?.currency ?? "GBP";
  const total = quote?.total ?? 0;

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
              className={cn("h-10 w-full rounded-md border px-3 text-sm", FIELD_CLASS)}
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

      {/* ── Total ───────────────────────────────────────────────────── */}
      <div className="bg-secondary-50 border-secondary-500 flex items-center justify-between rounded-lg border px-4 py-3">
        <span className="font-suse text-base font-semibold text-neutral-900">Total Fee</span>
        <span className="font-suse text-primary-600 text-xl font-bold">
          {money(currency, total)}
        </span>
      </div>

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
          <div className={cn("flex h-10 items-center rounded-md border px-3", FIELD_CLASS)}>
            <CardNumberElement options={STRIPE_ELEMENT_OPTIONS} className="w-full" />
          </div>
        </FieldShell>
        <div className="grid grid-cols-2 gap-4">
          <FieldShell label="Expiry date" required>
            <div className={cn("flex h-10 items-center rounded-md border px-3", FIELD_CLASS)}>
              <CardExpiryElement options={STRIPE_ELEMENT_OPTIONS} className="w-full" />
            </div>
          </FieldShell>
          <FieldShell label="Security code" required>
            <div className={cn("flex h-10 items-center rounded-md border px-3", FIELD_CLASS)}>
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
              className="h-4 w-4"
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
          <span className="text-sm text-neutral-600">How many</span>
          <select
            className={cn("h-9 w-24 rounded-md border px-2 text-sm", FIELD_CLASS)}
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
