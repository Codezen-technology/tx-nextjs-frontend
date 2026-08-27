import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartItemRow } from "@/components/cart/CartItemRow";
import type { CartItem } from "@/lib/stores/cart.store";

/**
 * QA-CART-A1 — frame `6239:113878` labels the unit price `Price: £24.99`; the
 * build rendered a bare number.
 *
 * A unit test because the e2e for this row needs a seeded guest cart and
 * `test.skip`s when the backend has no purchasable course — and a skip is
 * indistinguishable from a pass in the summary line, which is exactly the trap
 * `QA_EXECUTION.md` records. This guard cannot skip.
 */
vi.mock("@/lib/hooks/useCart", () => ({
  useCart: () => ({ currency: "£" }),
  useRemoveCartItem: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/hooks/useQuantityEditor", () => ({
  useQuantityEditor: () => ({
    localQty: 1,
    draft: "1",
    isUpdating: false,
    step: vi.fn(),
    onDraftChange: vi.fn(),
    onDraftBlur: vi.fn(),
  }),
}));

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    key: "abc",
    name: "Care Certificate Standard 2",
    price: 24.99,
    regular_price: 24.99,
    quantity: 1,
    line_total: 24.99,
    max_quantity: 10,
    editable: true,
    sold_individually: false,
    thumbnail: null,
    ...overrides,
  } as CartItem;
}

describe("CartItemRow — QA-CART-A1", () => {
  it("labels the unit price", () => {
    render(<CartItemRow item={makeItem()} />);
    expect(screen.getByText("Price:")).toBeInTheDocument();
  });

  it("puts the label on the price actually charged, not the struck regular price", () => {
    render(<CartItemRow item={makeItem({ regular_price: 30, price: 24.99 })} />);

    const struck = screen.getByText(/30\.00/);
    const label = screen.getByText("Price:");

    // The label must follow the struck regular price in document order, so the
    // row reads "£30.00 Price: £24.99" — labelling what the shopper pays, not
    // the number they are not paying.
    expect(struck.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
