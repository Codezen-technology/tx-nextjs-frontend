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
import type { CertProduct, CertSelection } from "@/types/certificate";

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

export function CertificateForm() {
  if (!stripePromise) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Online payment is not available right now. Please try again later.
      </p>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <CertificateFormInner />
    </Elements>
  );
}

function CertificateFormInner() {
  const stripe = useStripe();
  const elements = useElements();

  const {
    data: config,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["certificate", "config"],
    queryFn: () => certificateService.getConfig(),
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

  // Both GF products are required (each has an "I don't need" £0 option). Default
  // every product to its £0 choice so the required fields are always satisfied at
  // record time; the user upgrades from there. Derived (not stored in state) to
  // avoid setState-in-effect — `choices` only holds the user's overrides.
  const effectiveChoices = useMemo(() => {
    const out: Record<string, { choice: string; qty: number }> = {};
    if (!config) return out;
    for (const product of config.products) {
      const zero = product.choices.find((c) => c.price === 0) ?? product.choices.at(-1);
      out[product.fieldId] = choices[product.fieldId] ?? { choice: zero?.value ?? "", qty: 1 };
    }
    return out;
  }, [config, choices]);

  const selection: CertSelection = useMemo(
    () => ({ products: effectiveChoices, shipping: shipping || null }),
    [effectiveChoices, shipping],
  );

  const { data: quote } = useQuery({
    queryKey: ["certificate", "quote", JSON.stringify(selection)],
    queryFn: () => certificateService.getQuote(selection),
    enabled: Boolean(config),
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

  const hardcopy = config.products[1];

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

        {config.shipping && hardcopyChosen(hardcopy, effectiveChoices) && (
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

/** Hardcopy chosen with a priced (non-"I don't need") option → show shipping. */
function hardcopyChosen(
  hardcopy: CertProduct | undefined,
  choices: Record<string, { choice: string; qty: number }>,
): boolean {
  if (!hardcopy) return false;
  const sel = choices[hardcopy.fieldId]?.choice;
  return Boolean(hardcopy.choices.find((c) => c.value === sel && c.price > 0));
}
