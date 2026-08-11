import { describe, it, expect } from "vitest";
import { parseDisplayPrice, scaleDisplayPrice, planLineTotal } from "@/lib/utils/price";

describe("parseDisplayPrice", () => {
  it("splits symbol, amount and decimals", () => {
    expect(parseDisplayPrice("£49.00")).toEqual({
      symbol: "£",
      amount: 49,
      decimals: 2,
      suffix: "",
    });
  });

  it("handles the no-decimals shape production returns", () => {
    expect(parseDisplayPrice("£29")).toEqual({ symbol: "£", amount: 29, decimals: 0, suffix: "" });
  });

  it("strips thousands separators", () => {
    expect(parseDisplayPrice("£1,299.50")?.amount).toBe(1299.5);
  });

  it("keeps a trailing unit as suffix", () => {
    expect(parseDisplayPrice("£29/mo")).toEqual({
      symbol: "£",
      amount: 29,
      decimals: 0,
      suffix: "/mo",
    });
  });

  it("returns null for copy that carries no price", () => {
    expect(parseDisplayPrice("Contact us")).toBeNull();
    expect(parseDisplayPrice("")).toBeNull();
  });
});

describe("scaleDisplayPrice", () => {
  it("multiplies by quantity and keeps the original formatting", () => {
    expect(scaleDisplayPrice("£49.00", 3)).toBe("£147.00");
    expect(scaleDisplayPrice("£29", 2)).toBe("£58");
  });

  it("adds thousands separators past 999", () => {
    expect(scaleDisplayPrice("£999", 2)).toBe("£1,998");
  });

  it("is a no-op at quantity 1", () => {
    expect(scaleDisplayPrice("£49.00", 1)).toBe("£49.00");
  });

  it("leaves unparsable copy untouched rather than showing a wrong total", () => {
    expect(scaleDisplayPrice("Contact us", 5)).toBe("Contact us");
    expect(scaleDisplayPrice(undefined, 5)).toBe("");
  });
});

describe("planLineTotal", () => {
  it("prefers the numeric WooCommerce price when the plan is wired to a product", () => {
    expect(planLineTotal("£49.00", 49, "GBP", 3)).toBe("£147");
  });

  it("keeps decimals when the total is not whole", () => {
    expect(planLineTotal("£49.50", 49.5, "GBP", 3)).toBe("£148.50");
  });

  it("falls back to scaling the display string when product is null (production shape)", () => {
    expect(planLineTotal("£29", null, undefined, 4)).toBe("£116");
  });
});
