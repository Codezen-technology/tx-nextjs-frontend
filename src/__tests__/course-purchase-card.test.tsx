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

  it("renders 'Add to Basket' button on 'For me' tab", () => {
    const course = makeRichCourse({ product_id: 42 });
    render(<CoursePurchaseCard course={course} />);
    expect(screen.getByRole("button", { name: /add to basket/i })).toBeInTheDocument();
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
