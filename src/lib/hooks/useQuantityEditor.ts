"use client";

import { useEffect, useRef, useState } from "react";
import { useUpdateCartItem } from "@/lib/hooks/useCart";
import type { CartItem } from "@/lib/stores/cart.store";

/**
 * Encapsulates editable cart-item quantity for BOTH the cart page (`CartItemRow`)
 * and the dashboard basket drawer — one implementation, no duplication.
 *
 * Quantity writes are strictly EVENT-DRIVEN (from a click or a keystroke), never
 * fired from an effect that watches cart data. The old effect-driven approach
 * caused an infinite loop: a stale persisted quantity fighting the server value
 * (8↔9 ping-pong). Firing PUTs only from user input breaks that permanently.
 *
 * - `localQty` — authoritative display quantity (drives +/- disabled state, totals).
 * - `draft` — raw text of the typeable field, decoupled from `localQty` so the user
 *   can transiently clear it ("") or type multi-digit values without React snapping
 *   the number back mid-edit.
 * - Writes are debounced 400ms so holding +/- or fast typing coalesces into one PUT;
 *   the request is skipped entirely when the value already matches the server.
 */
export function useQuantityEditor(item: CartItem) {
  const { mutate: updateQty, isPending: isUpdating } = useUpdateCartItem();

  const [localQty, setLocalQty] = useState(item.quantity);
  const [draft, setDraft] = useState(String(item.quantity));

  // A ref (not state) so it survives renders without retriggering effects. While a
  // write is queued we suppress the display-sync so an incoming refetch can't clobber
  // the value the user is actively changing.
  const pendingWrite = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Display-only sync: mirror the server's authoritative quantity into local state.
  // NEVER fires a mutation, and is skipped while a user edit is queued — so it can't
  // feed back into a PUT and can't fight the server.
  useEffect(() => {
    if (pendingWrite.current) return;
    setLocalQty(item.quantity);
    setDraft(String(item.quantity));
  }, [item.quantity]);

  // Clear any queued write on unmount.
  useEffect(() => {
    return () => {
      if (pendingWrite.current) clearTimeout(pendingWrite.current);
    };
  }, []);

  const clampQty = (n: number) => Math.min(item.max_quantity, Math.max(1, n));

  const queueWrite = (next: number) => {
    if (pendingWrite.current) clearTimeout(pendingWrite.current);
    pendingWrite.current = setTimeout(() => {
      pendingWrite.current = null;
      if (next !== item.quantity) updateQty({ key: item.key, quantity: next });
    }, 400);
  };

  const step = (delta: number) => {
    const next = clampQty(localQty + delta);
    if (next === localQty) return;
    setLocalQty(next);
    setDraft(String(next));
    queueWrite(next);
  };

  // Typeable field: digits only, allow a transient empty string, commit (clamped) as
  // soon as a valid number is present.
  const onDraftChange = (raw: string) => {
    if (!/^\d*$/.test(raw)) return;
    setDraft(raw);
    if (raw === "") return;
    const next = clampQty(parseInt(raw, 10));
    setLocalQty(next);
    queueWrite(next);
  };

  // On blur/Enter, normalize the field: empty or 0 snaps back to a valid quantity.
  const onDraftBlur = () => {
    const parsed = parseInt(draft, 10);
    const next = clampQty(Number.isNaN(parsed) ? 1 : parsed);
    setLocalQty(next);
    setDraft(String(next));
    queueWrite(next);
  };

  return { localQty, draft, isUpdating, step, onDraftChange, onDraftBlur };
}
