import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CoursePurchaseCard } from "@/components/courses/course-purchase-card";
import { makeRichCourse } from "./fixtures/courses";

const mockPush = vi.fn();
const mockMutate = vi.fn((_vars: unknown, opts?: { onSuccess?: () => void }) =>
  opts?.onSuccess?.(),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/lib/hooks/useCart", () => ({
  useAddToCart: () => ({ mutate: mockMutate, isPending: false }),
}));

const DEFAULT_TIERS = [
  { min: 10, max: 19, percentage: 10 },
  { min: 20, max: 0, percentage: 20 },
];
const tierState = vi.hoisted(() => ({
  tiers: [
    { min: 10, max: 19, percentage: 10 },
    { min: 20, max: 0, percentage: 20 },
  ] as { min: number; max: number; percentage: number }[],
}));

vi.mock("@/lib/hooks/useBulkTiers", () => ({
  useBulkTiers: () => ({ data: tierState.tiers, isLoading: false }),
}));

/** The tier table renders on the Individual tab when toggled open. */
const bulkTableShown = () => screen.queryByText(/per person/i) !== null;

beforeEach(() => {
  mockPush.mockReset();
  mockMutate.mockClear();
  tierState.tiers = DEFAULT_TIERS;
});

describe("CoursePurchaseCard", () => {
  it("renders the course price", () => {
    const course = makeRichCourse();
    render(<CoursePurchaseCard course={course} />);
    expect(screen.getByText(/£99\.00/i)).toBeInTheDocument();
  });

  it("shows strikethrough regular price when on sale", () => {
    const course = makeRichCourse();
    render(<CoursePurchaseCard course={course} />);
    expect(screen.getByText(/£129\.00/i)).toBeInTheDocument();
  });

  it("renders 'Buy this course' button when product id exists", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    expect(screen.getByRole("button", { name: /buy this course/i })).toBeInTheDocument();
  });

  it("shows 'Get in Touch' link when no product id", () => {
    const course = makeRichCourse({ product_id: null, pricing: null });
    render(<CoursePurchaseCard course={course} />);
    expect(screen.getByRole("link", { name: /get in touch/i })).toBeInTheDocument();
  });

  it("redirects to the cart on buy now click", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    fireEvent.click(screen.getByRole("button", { name: /buy this course/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 42, quantity: 1 }),
      expect.any(Object),
    );
    expect(mockPush).toHaveBeenCalledWith("/cart");
  });

  it("buys the quantity shown in the stepper", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    fireEvent.click(screen.getByLabelText(/increase quantity/i));
    fireEvent.click(screen.getByLabelText(/increase quantity/i));
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /buy this course/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 42, quantity: 3 }),
      expect.any(Object),
    );
  });

  it("resets quantity to 1 when switching to the 'Individual' tab", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    // Switch to Business first
    fireEvent.click(screen.getByRole("button", { name: /business/i }));
    // Switch back to Individual
    fireEvent.click(screen.getByRole("button", { name: /individual/i }));
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
  });

  it("applies the bulk tier discount to the displayed total", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    fireEvent.change(screen.getByDisplayValue("1"), { target: { value: "10" } });
    // 10 licences × £99 with the 10% tier = £891.00
    expect(screen.getByText(/£891\.00/)).toBeInTheDocument();
  });

  it("clamps a non-numeric quantity back to 1 on blur", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    const input = screen.getByDisplayValue("1");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
  });

  // ── Tab switching ──

  it("switches to Business tab and shows team content", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    fireEvent.click(screen.getByRole("button", { name: /business/i }));
    // Business tab: shows team heading and Request a Quote
    expect(screen.getByText(/built for your whole team/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a quote/i })).toBeInTheDocument();
    // No quantity stepper on Business tab
    expect(screen.queryByLabelText(/increase quantity/i)).not.toBeInTheDocument();
  });

  it("stays on Individual tab when quantity increases", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    fireEvent.click(screen.getByLabelText(/increase quantity/i));
    // Still on Individual: Buy button visible, no team content
    expect(screen.getByRole("button", { name: /buy this course/i })).toBeInTheDocument();
    expect(screen.queryByText(/built for your whole team/i)).not.toBeInTheDocument();
  });

  // ── Bulk pricing toggle ──

  it("shows See Bulk Pricing link on Individual tab", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    expect(screen.getByRole("button", { name: /see bulk pricing/i })).toBeInTheDocument();
    expect(bulkTableShown()).toBe(false);
  });

  it("toggles bulk pricing table on click", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    fireEvent.click(screen.getByRole("button", { name: /see bulk pricing/i }));
    expect(bulkTableShown()).toBe(true);
    expect(screen.getByRole("button", { name: /hide bulk pricing/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide bulk pricing/i }));
    expect(bulkTableShown()).toBe(false);
    expect(screen.getByRole("button", { name: /see bulk pricing/i })).toBeInTheDocument();
  });

  it("hides bulk pricing when switching tabs", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    fireEvent.click(screen.getByRole("button", { name: /see bulk pricing/i }));
    expect(bulkTableShown()).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /business/i }));
    fireEvent.click(screen.getByRole("button", { name: /individual/i }));
    expect(bulkTableShown()).toBe(false);
  });

  // ── Extra X% saved badge ──

  it("shows Extra X% saved badge when quantity > 1", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    expect(screen.queryByText(/extra.*saved/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("1"), { target: { value: "10" } });
    expect(screen.getByText(/extra 10% saved/i)).toBeInTheDocument();
  });

  it("hides Extra X% saved badge at quantity 1", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    fireEvent.change(screen.getByDisplayValue("1"), { target: { value: "10" } });
    expect(screen.getByText(/extra 10% saved/i)).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("10"), { target: { value: "1" } });
    expect(screen.queryByText(/extra.*saved/i)).not.toBeInTheDocument();
  });

  // ── Business tab content ──

  it("shows team benefit bullet points on Business tab", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    fireEvent.click(screen.getByRole("button", { name: /business/i }));
    expect(screen.getByText(/cost-effective training solution/i)).toBeInTheDocument();
    expect(screen.getByText(/central training dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/dedicated manager/i)).toBeInTheDocument();
    expect(screen.getByText(/real-time progress tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/streamlined enrolment/i)).toBeInTheDocument();
  });

  it("does not show price on Business tab", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    fireEvent.click(screen.getByRole("button", { name: /business/i }));
    expect(screen.queryByText(/£99\.00/i)).not.toBeInTheDocument();
  });

  // ── Existing feature tests ──

  it("shows CPD points when set", () => {
    const course = makeRichCourse({ cpd_points: 3 });
    render(<CoursePurchaseCard course={course} />);
    expect(screen.getByText(/cpd points: 3/i)).toBeInTheDocument();
  });

  it("shows 14 Days Money-Back Guarantee", () => {
    render(<CoursePurchaseCard course={makeRichCourse()} />);
    expect(screen.getByText(/14 days money-back guarantee/i)).toBeInTheDocument();
  });

  it("shows 'Contact us for pricing' when no pricing block", () => {
    const course = makeRichCourse({ pricing: null });
    render(<CoursePurchaseCard course={course} />);
    expect(screen.getByText(/contact us for pricing/i)).toBeInTheDocument();
  });
});
