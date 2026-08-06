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

// Bulk tiers come from TanStack Query; the card renders outside a QueryClientProvider here.
vi.mock("@/lib/hooks/useBulkTiers", () => ({
  useBulkTiers: () => ({
    data: [
      { min: 10, max: 19, percentage: 10 },
      { min: 20, max: 0, percentage: 20 },
    ],
    isLoading: false,
  }),
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

  it("redirects to checkout on buy now click", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    fireEvent.click(screen.getByRole("button", { name: /buy this course/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 42, quantity: 1 }),
      expect.any(Object),
    );
    expect(mockPush).toHaveBeenCalledWith("/checkout");
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

  it("resets quantity to 1 when switching back to the 'For me' tab", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    fireEvent.click(screen.getByLabelText(/increase quantity/i));
    fireEvent.click(screen.getByRole("button", { name: /for me/i }));
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /buy this course/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 1 }),
      expect.any(Object),
    );
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

  it("switches to teams tab on click", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    fireEvent.click(screen.getByRole("button", { name: /for teams/i }));
    // Teams tab: quantity stepper appears
    expect(screen.getByLabelText(/increase quantity/i)).toBeInTheDocument();
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
