import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CoursePurchaseCard } from "@/components/courses/course-purchase-card";
import { makeRichCourse } from "./fixtures/courses";

const mockPush = vi.fn();
// useAddToCart().mutate(vars, { onSuccess }) — invoke onSuccess so buy-now navigates.
const mockMutate = vi.fn((_vars: unknown, opts?: { onSuccess?: () => void }) =>
  opts?.onSuccess?.(),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/lib/hooks/useCart", () => ({
  useAddToCart: () => ({ mutate: mockMutate, isPending: false }),
}));

// The card and BulkDiscountTable both read this hook; mocking the hook keeps the
// suite free of a QueryClientProvider, matching how useCart is handled above.
const BULK_TIERS = [
  { min: 2, max: 5, percentage: 10 },
  { min: 6, max: 0, percentage: 20 },
];

vi.mock("@/lib/hooks/useBulkTiers", () => ({
  useBulkTiers: () => ({ data: BULK_TIERS, isLoading: false }),
}));

beforeEach(() => {
  mockPush.mockReset();
  mockMutate.mockClear();
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
    // Regular price is £129, sale price is £99
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

  it("offers only 'Buy this course' — the Add to Basket path was removed", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    expect(screen.queryByRole("button", { name: /add to basket/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buy this course/i })).toBeInTheDocument();
  });

  it("redirects to checkout on buy now click", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    fireEvent.click(screen.getByRole("button", { name: /buy this course/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 42 }),
      expect.any(Object),
    );
    expect(mockPush).toHaveBeenCalledWith("/checkout");
  });

  it("switches to teams tab on click", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    // The stepper is shared by both tabs, so assert on the teams-only bulk table.
    expect(screen.queryByText(/2 - 5 users/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /for teams/i }));
    expect(screen.getByText(/2 - 5 users/i)).toBeInTheDocument();
    expect(screen.getByText(/6\+ users/i)).toBeInTheDocument();
  });

  it("moves to the teams tab once quantity climbs above one", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    fireEvent.click(screen.getByLabelText(/increase quantity/i));
    expect(screen.getByText(/2 - 5 users/i)).toBeInTheDocument();
  });

  it("applies the bulk tier discount to the teams total", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    fireEvent.click(screen.getByRole("button", { name: /for teams/i }));
    fireEvent.click(screen.getByLabelText(/increase quantity/i));
    // 2 seats × £99 with the 2–5 tier's 10% off = £178.20
    expect(screen.getByText(/£178\.20/i)).toBeInTheDocument();
  });

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
