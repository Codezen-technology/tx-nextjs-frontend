import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRemoveCartItem, useAddToCart, useUpdateCartItem } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cart.store";
import { queryKeys } from "@/lib/utils/query-keys";
import type { Cart, WCStoreCart } from "@/lib/stores/cart.store";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetchMock = vi.fn();

function res(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    text: () => Promise.resolve(status === 204 ? "" : JSON.stringify(data)),
  });
}

function makeWCCart(itemCount = 0): WCStoreCart {
  return {
    items: [],
    coupons: [],
    fees: [],
    items_count: itemCount,
    totals: {
      total_items: "1499",
      total_items_tax: "249",
      total_fees: "0",
      total_fees_tax: "0",
      total_discount: "0",
      total_tax: "249",
      total_price: "1499",
      currency_code: "GBP",
      currency_minor_unit: 2,
      currency_symbol: "£",
      tax_lines: [{ name: "VAT", price: "249", rate: "20" }],
    },
  };
}

const CART_ITEM: Cart["items"][number] = {
  key: "key-abc",
  product_id: 101,
  name: "Test Course",
  thumbnail: "",
  price: 14.99,
  regular_price: 79.0,
  quantity: 1,
  line_total: 14.99,
  sold_individually: true,
  max_quantity: 1,
};

const MOCK_CART: Cart = {
  items: [CART_ITEM],
  item_count: 1,
  subtotal: 14.99,
  vat_rate: 20,
  vat_amount: 2.49,
  discount: 0,
  fees: [],
  total: 14.99,
  coupon_code: null,
  currency: "£",
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper: Wrapper, qc };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  localStorage.setItem("wc-cart-token", "tok_test");
  localStorage.setItem("wc-cart-nonce", "nonce_test");

  useCartStore.setState({
    items: [CART_ITEM],
    itemCount: 1,
    totals: {
      subtotal: 14.99,
      vat_rate: 20,
      vat_amount: 2.49,
      discount: 0,
      fees: [],
      total: 14.99,
      coupon_code: null,
      item_count: 1,
      currency: "£",
    },
    isOpen: false,
    hasHydrated: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

// ─── useRemoveCartItem ────────────────────────────────────────────────────────

describe("useRemoveCartItem()", () => {
  it("optimistically removes item before server responds", async () => {
    // Slow response to observe optimistic state
    let resolveDelete!: (v: unknown) => void;
    const deletePromise = new Promise((r) => {
      resolveDelete = r;
    });

    fetchMock
      .mockReturnValueOnce(deletePromise) // DELETE hangs
      .mockResolvedValueOnce(res(makeWCCart(0))); // GET re-fetch

    const { wrapper, qc } = makeWrapper();
    qc.setQueryData(queryKeys.cart.detail, MOCK_CART);

    const { result } = renderHook(() => useRemoveCartItem(), { wrapper });

    act(() => {
      result.current.mutate("key-abc");
    });

    // Optimistic remove fires before fetch resolves
    await waitFor(() => {
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    resolveDelete(res(null, 204));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back optimistic remove on server error", async () => {
    fetchMock.mockResolvedValueOnce(res({ message: "Server error" }, 500));

    const { wrapper, qc } = makeWrapper();
    qc.setQueryData(queryKeys.cart.detail, MOCK_CART);

    const { result } = renderHook(() => useRemoveCartItem(), { wrapper });

    act(() => {
      result.current.mutate("key-abc");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Snapshot restored after rollback
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].key).toBe("key-abc");
  });

  it("re-fetches cart after successful delete (invalidates query)", async () => {
    fetchMock.mockResolvedValueOnce(res(null, 204)).mockResolvedValueOnce(res(makeWCCart(0)));

    const { wrapper, qc } = makeWrapper();
    qc.setQueryData(queryKeys.cart.detail, MOCK_CART);

    const { result } = renderHook(() => useRemoveCartItem(), { wrapper });
    act(() => {
      result.current.mutate("key-abc");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Two fetch calls: DELETE + GET re-fetch
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ─── useAddToCart ─────────────────────────────────────────────────────────────

describe("useAddToCart()", () => {
  it("updates store and query cache on success", async () => {
    const updatedWCCart = makeWCCart(2);
    fetchMock.mockResolvedValueOnce(res(updatedWCCart));

    const { wrapper, qc } = makeWrapper();
    qc.setQueryData(queryKeys.cart.detail, MOCK_CART);

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ product_id: 202, quantity: 1 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // onSuccess calls setCart(cart) → Zustand store reflects added item
    expect(useCartStore.getState().itemCount).toBe(2);
  });

  it("throws ApiError on add-to-cart failure", async () => {
    fetchMock.mockResolvedValueOnce(res({ message: "Out of stock" }, 400));

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ product_id: 99, quantity: 1 })).rejects.toThrow(
        "Out of stock",
      );
    });
  });
});

// ─── useUpdateCartItem ────────────────────────────────────────────────────────

describe("useUpdateCartItem()", () => {
  it("updates query cache on success", async () => {
    const updated = makeWCCart(2);
    fetchMock.mockResolvedValueOnce(res(updated));

    const { wrapper, qc } = makeWrapper();
    qc.setQueryData(queryKeys.cart.detail, MOCK_CART);

    const { result } = renderHook(() => useUpdateCartItem(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ key: "key-abc", quantity: 2 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("invalidates query on error so UI re-fetches true state", async () => {
    fetchMock.mockResolvedValueOnce(res({ message: "Invalid quantity" }, 400));

    const { wrapper, qc } = makeWrapper();
    qc.setQueryData(queryKeys.cart.detail, MOCK_CART);

    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useUpdateCartItem(), { wrapper });

    await act(async () => {
      result.current.mutate({ key: "key-abc", quantity: 0 });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
