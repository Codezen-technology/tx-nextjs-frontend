import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardBrandMarks, CARD_BRANDS } from "@/components/checkout/CardBrandMarks";

/**
 * QA-CHECK-A3 — the checkout page showed brand names as text in boxes, and the
 * two surfaces that showed them disagreed: five labels in the badge (including
 * JCB), four in the selector. The frame carries four marks and no JCB.
 */
describe("CardBrandMarks", () => {
  it("renders the four brands the design carries, in order", () => {
    expect(CARD_BRANDS.map((b) => b.name)).toEqual([
      "American Express",
      "Discover",
      "Mastercard",
      "Visa",
    ]);
  });

  it("renders each brand as an image, not as text", () => {
    render(<CardBrandMarks />);
    const marks = screen.getAllByRole("img");
    expect(marks).toHaveLength(4);
    for (const brand of CARD_BRANDS) {
      expect(screen.getByAltText(brand.name)).toBeInTheDocument();
    }
  });

  it("shows no text abbreviation", () => {
    const { container } = render(<CardBrandMarks />);
    // "MC", "DISC", "JCB" were the old labels. A mark is an image or it is not a mark.
    expect(container.textContent?.trim()).toBe("");
  });
});
