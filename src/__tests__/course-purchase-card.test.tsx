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
// Held in a hoisted box so a test can swap the tier set before rendering, and so the card
// and the table read the *same* array — the highlight matches a tier by identity.
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

/** The tier table renders on the teams tab only, so it is the observable tab marker. */
const teamsTabShown = () => screen.queryByText(/per person/i) !== null;

/** Tier rows carry `aria-current` only when the quantity has reached them. */
const activeTierLabels = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[aria-current="true"]')).map((row) =>
    // Spans in document order: marker slot, band label (which holds the SR phrase), …
    (row.querySelectorAll("span")[1]?.textContent ?? "").replace("— your current tier", "").trim(),
  );

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

  // ── The tab is derived from the quantity, from every control that commits one ──

  it("returns to the 'For me' tab when 1 is typed into the quantity field", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "5" } });
    expect(teamsTabShown()).toBe(true);

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "1" } });
    expect(teamsTabShown()).toBe(false);
  });

  it("returns to the 'For me' tab when the stepper goes back down to 1", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    fireEvent.click(screen.getByLabelText(/increase quantity/i));
    expect(teamsTabShown()).toBe(true);

    fireEvent.click(screen.getByLabelText(/decrease quantity/i));
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    expect(teamsTabShown()).toBe(false);
  });

  it("returns to the 'For me' tab when a cleared field is blurred back to 1", () => {
    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "5" } });
    expect(teamsTabShown()).toBe(true);

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    expect(teamsTabShown()).toBe(false);
  });

  it("moves to the 'For teams' tab from any control that raises the quantity", () => {
    const { unmount } = render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    fireEvent.click(screen.getByLabelText(/increase quantity/i));
    expect(teamsTabShown()).toBe(true);
    unmount();

    render(<CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "2" } });
    expect(teamsTabShown()).toBe(true);
  });

  // ── The tier table marks the band the quantity has reached ──

  it("marks the tier the current quantity falls in, and only that one", () => {
    tierState.tiers = [
      { min: 10, max: 19, percentage: 10 },
      { min: 20, max: 49, percentage: 25 },
      { min: 50, max: 100, percentage: 50 },
    ];
    const { container } = render(
      <CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />,
    );
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "21" } });

    expect(activeTierLabels(container)).toEqual(["20 - 49 users"]);
  });

  it("marks nothing while the quantity is below every tier", () => {
    const { container } = render(
      <CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />,
    );
    // Reach the teams tab so the table is on screen, then drop back under the first tier.
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "10" } });
    expect(activeTierLabels(container)).toEqual(["10 - 19 users"]);

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "9" } });
    expect(activeTierLabels(container)).toEqual([]);
  });

  it("marks the tier that produced the header price when tiers overlap", () => {
    // Both bands cover 21; the larger discount wins the price, so it must win the row.
    tierState.tiers = [
      { min: 10, max: 100, percentage: 10 },
      { min: 20, max: 49, percentage: 25 },
    ];
    const { container } = render(
      <CoursePurchaseCard course={makeRichCourse({ product_id: 42 })} />,
    );
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "21" } });

    // 21 × £99 at 25% off = £1,559.25
    expect(screen.getByText(/£1,559\.25/)).toBeInTheDocument();
    expect(activeTierLabels(container)).toEqual(["20 - 49 users"]);
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
