import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SecureCheckoutBand } from "@/components/commerce/SecureCheckoutBand";
import { CARD_BRANDS } from "@/components/commerce/CardBrandMarks";

/**
 * QA-CHECK-D1 / QA-CHECK-A5 — the band beneath the pay button, `image 24`.
 *
 * The band's own artwork draws seven brands; the design's payment-method row
 * draws four, and `checkout-payment-presentation` ratified those four. These
 * tests pin the band to the shared list, because the failure mode is someone
 * opening the artwork later and "correcting" it back to seven — which would
 * advertise brands the gateway may not take.
 */
describe("SecureCheckoutBand", () => {
  it("states the safe-and-secure assurance", () => {
    render(<SecureCheckoutBand />);
    expect(screen.getByText(/guaranteed/i)).toBeInTheDocument();
    expect(screen.getByText(/safe & secure/i)).toBeInTheDocument();
  });

  it("indicates the payment processor", () => {
    render(<SecureCheckoutBand />);
    expect(screen.getByText(/powered by stripe/i)).toBeInTheDocument();
  });

  it("renders the shared brand list, not a list of its own", () => {
    render(<SecureCheckoutBand />);
    const marks = screen.getAllByRole("img");
    expect(marks).toHaveLength(CARD_BRANDS.length);
    expect(marks.map((m) => m.getAttribute("alt"))).toEqual(CARD_BRANDS.map((b) => b.name));
  });

  it("does not advertise the artwork's extra brands", () => {
    const { container } = render(<SecureCheckoutBand />);
    const alts = screen.getAllByRole("img").map((m) => m.getAttribute("alt") ?? "");
    for (const brand of ["JCB", "Diners", "UnionPay"]) {
      expect(alts.some((a) => a.includes(brand))).toBe(false);
      expect(new RegExp(brand, "i").test(container.textContent ?? "")).toBe(false);
    }
  });
});
