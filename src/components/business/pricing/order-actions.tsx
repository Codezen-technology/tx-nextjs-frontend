"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OrderActionsProps {
  onCheckout: () => void;
  onQuote: () => void;
  loading: boolean;
  disabled: boolean;
  vatEnabled: boolean;
  vatLabel: string;
}

function ContactModal({
  open,
  onClose,
  email,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#F9A31A]/40 text-2xl">
            🌐
          </div>
          <DialogTitle>Contact us</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-neutral-500">
          Have a question about your order, VAT, or need a custom quote? Reach us at:
        </p>
        {email ? (
          <a
            href={`mailto:${email}`}
            className="font-semibold break-all text-[#3F576F] hover:underline"
          >
            {email}
          </a>
        ) : (
          <p className="text-sm text-neutral-400">Contact email not configured.</p>
        )}
        <Button onClick={onClose} className="mt-2 w-full bg-[#3F576F] hover:bg-[#33485d]">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function OrderActions({
  onCheckout,
  onQuote,
  loading,
  disabled,
  vatEnabled,
  vatLabel,
}: OrderActionsProps) {
  const [showContact, setShowContact] = useState(false);
  const settings = useSiteSettings();
  const contactEmail = settings?.contact_email ?? "";

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={onCheckout}
        disabled={disabled || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3F576F] py-2.5 font-semibold text-white transition-colors hover:bg-[#33485d] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          "🔒 Continue to checkout"
        )}
      </button>

      <button
        type="button"
        onClick={onQuote}
        disabled={disabled}
        className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Request a quote
      </button>

      {vatEnabled && (
        <p className="mt-2 text-center text-xs text-neutral-400">{vatLabel}. Outside the UK?</p>
      )}

      <button
        type="button"
        onClick={() => setShowContact(true)}
        className="w-full rounded-lg bg-[#F9A31A] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e89410]"
      >
        Contact us
      </button>

      <ContactModal open={showContact} onClose={() => setShowContact(false)} email={contactEmail} />
    </div>
  );
}
