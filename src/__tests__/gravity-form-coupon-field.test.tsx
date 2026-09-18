import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CouponError } from "@/lib/services/forms";
import type * as FormsModuleNs from "@/lib/services/forms";
import type { GravityField, GravityForm as GravityFormType } from "@/types/form";

type FormsModule = typeof FormsModuleNs;

/**
 * A coupon field on an ordinary Gravity Form.
 *
 * The point of the round-trip is that only Gravity Forms knows whether a code is
 * expired, spent or non-stackable; typing one into a text input and submitting it
 * blind would fail the form's own validation with no explanation. These tests pin
 * that the box applies before submit, and that the accepted codes are what get
 * submitted — without them the entry records no discount and the redemption
 * never counts.
 */

const applyCoupon = vi.fn();
const submitForm = vi.fn();

vi.mock("@/lib/services/forms", async () => {
  const actual = await vi.importActual<FormsModule>("@/lib/services/forms");
  return {
    ...actual,
    formsService: {
      applyCoupon: (...args: unknown[]) => applyCoupon(...args),
      submitForm: (...args: unknown[]) => submitForm(...args),
      validateForm: vi.fn(),
      getForm: vi.fn(),
    },
  };
});

const { GravityForm } = await import("@/components/forms/gravity-form");

function field(overrides: Partial<GravityField> & Pick<GravityField, "id" | "type">): GravityField {
  return {
    label: "",
    isRequired: false,
    placeholder: "",
    description: "",
    defaultValue: "",
    cssClass: "",
    size: "medium",
    pageNumber: 1,
    errorMessage: "",
    name: `input_${overrides.id}`,
    ...overrides,
  } as GravityField;
}

const FORM: GravityFormType = {
  id: 9,
  title: "Order",
  description: "",
  button: { text: "Send" },
  hasPayment: false,
  hasCoupon: true,
  couponFieldId: 73,
  isMultiPage: false,
  pageCount: 1,
  fields: [
    field({ id: "2", type: "text", label: "Full name", isRequired: true }),
    field({ id: "73", type: "coupon", label: "Coupon" }),
  ],
};

beforeEach(() => {
  applyCoupon.mockReset();
  submitForm.mockReset();
  submitForm.mockResolvedValue({ entry_id: 1, confirmation_type: "message" });
});

describe("coupon field on an ordinary form", () => {
  it("renders a code box with Apply, not a plain text input", async () => {
    render(<GravityForm form={FORM} />);

    expect(screen.getByLabelText("Coupon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
  });

  it("applies the code against this form and lists what the server accepted", async () => {
    applyCoupon.mockResolvedValue({
      coupon: { code: "SAVE10", name: "Ten off", type: "flat", amount: 10 },
      applied: ["SAVE10"],
      field: { id: 73, name: "input_73" },
      totals: null,
    });

    render(<GravityForm form={FORM} />);
    fireEvent.change(screen.getByLabelText("Coupon"), { target: { value: "save10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    // The list comes from the server's `applied`, which is normalized and has
    // already judged stacking — not from a local append.
    expect(await screen.findByText("SAVE10")).toBeInTheDocument();
    expect(applyCoupon.mock.calls[0][0]).toBe(9);
  });

  it("submits the accepted codes under the coupon field's own input name", async () => {
    applyCoupon.mockResolvedValue({
      coupon: { code: "SAVE10", name: "Ten off", type: "flat", amount: 10 },
      applied: ["SAVE10"],
      field: { id: 73, name: "input_73" },
      totals: null,
    });

    render(<GravityForm form={FORM} />);
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Jane" } });
    fireEvent.change(screen.getByLabelText("Coupon"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    await screen.findByText("SAVE10");

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(submitForm).toHaveBeenCalled());
    const payload = submitForm.mock.calls[0][1] as Record<string, unknown>;
    // Gravity Forms stores the codes comma-separated on the entry; this is what
    // makes it discount the total and count the redemption.
    expect(payload.input_73).toBe("SAVE10");
  });

  it("shows the server's refusal text and submits nothing for that code", async () => {
    applyCoupon.mockRejectedValue(new CouponError("This coupon has expired.", "SAVE10"));

    render(<GravityForm form={FORM} />);
    fireEvent.change(screen.getByLabelText("Coupon"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(await screen.findByText("This coupon has expired.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("shows no price or discount — a non-payment form has no total", async () => {
    applyCoupon.mockResolvedValue({
      coupon: { code: "SAVE10", name: "Ten off", type: "flat", amount: 10 },
      applied: ["SAVE10"],
      field: { id: 73, name: "input_73" },
      totals: null,
    });

    const { container } = render(<GravityForm form={FORM} />);
    fireEvent.change(screen.getByLabelText("Coupon"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    await screen.findByText("SAVE10");

    expect(container.textContent).not.toMatch(/£|discount/i);
  });
});
