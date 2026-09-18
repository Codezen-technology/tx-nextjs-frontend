"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { FIELD_CLASS, LABEL_CLASS } from "@/components/gf-fields";

/**
 * Coupon code box: label, input, Apply — the widget both coupon surfaces share.
 *
 * Deliberately stateless about validity: `onApply` resolves to the backend's
 * refusal text, or null when the code was accepted, and this component only
 * decides where to put it. Any client-side "looks like a code" check here would
 * eventually disagree with Gravity Forms and tell a buyer to retype something
 * that would have worked.
 *
 * Money is not its business. The list of accepted codes is the caller's
 * `children`, because only the certificate flow has a server-priced quote to
 * show a per-code discount from — a plain Gravity Form has no total at all.
 */
export function CouponBox({
  id,
  label,
  fieldClass = FIELD_CLASS,
  labelClass = LABEL_CLASS,
  placeholder,
  disabled = false,
  disabledHint,
  renderError,
  onApply,
  beforeInput,
  children,
}: {
  /** DOM id tying the label to the input — unique per rendered box. */
  id: string;
  label: string;
  fieldClass?: string;
  labelClass?: string;
  placeholder?: string;
  /** True when the order has nothing a code could discount. */
  disabled?: boolean;
  /** Shown in place of the error while `disabled`, explaining why. */
  disabledHint?: string;
  /** Each surface styles its own field errors; default is the plain red line. */
  renderError?: (message: string) => ReactNode;
  /** Resolves to the refusal text to show, or null when the code was accepted. */
  onApply: (code: string) => Promise<string | null>;
  /** Slot between label and input — the hidden field a react-hook-form registers. */
  beforeInput?: ReactNode;
  /** The applied-code list, rendered by whoever knows what a code is worth. */
  children?: ReactNode;
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
    try {
      const refusal = await onApply(trimmed);
      if (refusal) {
        setError(refusal);
        return;
      }
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className={cn("block text-sm font-medium", labelClass)} htmlFor={id}>
        {label || "Coupon"}
      </label>
      {beforeInput}
      <div className="flex items-start gap-2">
        <input
          id={id}
          type="text"
          className={cn(fieldClass, "uppercase", disabled && "cursor-not-allowed opacity-60")}
          value={code}
          disabled={busy || disabled}
          autoComplete="off"
          placeholder={placeholder || undefined}
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

      {disabled && disabledHint && (
        <p className="font-open-sans text-sm text-neutral-500">{disabledHint}</p>
      )}

      {error &&
        !disabled &&
        (renderError ? renderError(error) : <p className="text-sm text-red-600">{error}</p>)}

      {children}
    </div>
  );
}
