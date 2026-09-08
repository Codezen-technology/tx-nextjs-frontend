import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PricingSection } from "@/components/home/pricing-section";
import { PricingCta } from "@/components/home/pricing-cta";
import { makePlan, monthlyProduct, makePricingSection } from "./fixtures/pricing-plans";

const mockMutate = vi.fn();
const mockPush = vi.fn();
vi.mock("@/lib/hooks/useCart", () => ({
  useAddToCart: () => ({ mutate: mockMutate, isPending: false }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

const headerLink = () => screen.queryByRole("link", { name: /view more details/i });

describe("PricingSection — the header call to action is configured per page", () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockPush.mockClear();
  });

  it("renders the header link by default, which is what the homepage relies on", () => {
    render(<PricingSection data={makePricingSection()} />);
    expect(headerLink()).toBeInTheDocument();
    expect(headerLink()).toHaveAttribute("href", "/pricing");
  });

  it("omits the header link when asked to, as /pricing does — its target is /pricing", () => {
    render(<PricingSection data={makePricingSection()} showHeaderCta={false} />);
    expect(headerLink()).not.toBeInTheDocument();
  });

  it("keeps the heading and description when the link is suppressed", () => {
    render(<PricingSection data={makePricingSection()} showHeaderCta={false} />);
    expect(screen.getByText("Enjoy Unlimited Training, Save More!")).toBeInTheDocument();
    expect(screen.getByText("Get Access to Hundreds of Premium Courses")).toBeInTheDocument();
  });

  it("renders nothing at all when the payload carries no plans", () => {
    const { container } = render(<PricingSection data={makePricingSection({ plans: [] })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no payload — /pricing's fallback if /home fails", () => {
    const { container } = render(<PricingSection />);
    expect(container).toBeEmptyDOMElement();
  });
});

/**
 * The difference that made the two pages diverge in a way a visitor could feel: the
 * `/pricing` payload returned `product: null`, so its CTAs silently fell through to
 * navigation instead of adding to the cart. Pin both branches so a data regression fails
 * here rather than on the page.
 */
describe("PricingCta — purchasability follows the plan's product", () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockPush.mockClear();
  });

  it("adds the wired product to the cart", () => {
    render(<PricingCta plan={makePlan({ product: monthlyProduct })} quantity={3} />);
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toEqual({ product_id: 69664, quantity: 3 });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("falls through to navigation when the plan has no product", () => {
    render(<PricingCta plan={makePlan({ ctaHref: "/register" })} />);
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/register");
  });
});
