import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuantitySelector } from "@/components/home/quantity-selector";
import type { HomePricingPlan } from "@/types/home";

const mockMutate = vi.fn();
vi.mock("@/lib/hooks/useCart", () => ({
  useAddToCart: () => ({ mutate: mockMutate, isPending: false }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function makePlan(overrides: Partial<HomePricingPlan> = {}): HomePricingPlan {
  return {
    name: "Monthly Access",
    price: "£29",
    ctaLabel: "Get started",
    variant: "default",
    features: [],
    ...overrides,
  };
}

const increase = () => fireEvent.click(screen.getByRole("button", { name: /increase quantity/i }));
const decrease = () => fireEvent.click(screen.getByRole("button", { name: /decrease quantity/i }));
const price = () => screen.getByTestId("plan-price").textContent;

describe("QuantitySelector — displayed amount tracks quantity", () => {
  beforeEach(() => mockMutate.mockClear());

  it("scales the formatted price string when the plan has no product (production shape)", () => {
    render(<QuantitySelector plan={makePlan()} />);
    expect(price()).toBe("£29");
    increase();
    expect(price()).toBe("£58");
    increase();
    expect(price()).toBe("£87");
  });

  it("scales from the numeric product price when one is wired up", () => {
    const plan = makePlan({
      price: "£49.00",
      product: {
        id: 69664,
        name: "Monthly Access",
        price: 49,
        priceFormatted: "£49.00",
        regularPrice: 199,
        regularPriceFormatted: "£199.00",
        salePrice: 49,
        isOnSale: true,
        currency: "GBP",
        permalink: "https://example.test/product/monthly",
        addToCartUrl: "https://example.test/?add-to-cart=69664",
      },
    });
    render(<QuantitySelector plan={plan} />);
    increase();
    expect(price()).toBe("£98");
  });

  it("scales the struck-through original price alongside it", () => {
    render(<QuantitySelector plan={makePlan({ originalPrice: "£199.00" })} />);
    increase();
    expect(screen.getByText("£398.00")).toBeInTheDocument();
  });

  it("returns to the unit price when the quantity comes back down", () => {
    render(<QuantitySelector plan={makePlan()} />);
    increase();
    decrease();
    expect(price()).toBe("£29");
  });

  it("sends the shown quantity to the cart", () => {
    const plan = makePlan({
      product: {
        id: 7,
        name: "Monthly Access",
        price: 29,
        priceFormatted: "£29",
        regularPrice: 29,
        regularPriceFormatted: "£29",
        salePrice: null,
        isOnSale: false,
        currency: "GBP",
        permalink: "https://example.test/product/monthly",
        addToCartUrl: "https://example.test/?add-to-cart=7",
      },
    });
    render(<QuantitySelector plan={plan} />);
    increase();
    increase();
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 7, quantity: 3 }),
      expect.any(Object),
    );
  });
});
