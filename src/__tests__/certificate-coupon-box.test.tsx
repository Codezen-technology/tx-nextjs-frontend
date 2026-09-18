import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CertificateForm } from "@/components/certificate/certificate-form";
import { ApiError } from "@/lib/api/error";
import { CouponError } from "@/lib/services/forms";
import type * as FormsModuleNs from "@/lib/services/forms";
import { CERT_CONFIG_23 } from "./fixtures/certificate-config";
import type { CertConfig, CertProductSlug, CertQuote, CertSelection } from "@/types/certificate";

type FormsModule = typeof FormsModuleNs;

/**
 * The coupon box on the certificate order form.
 *
 * What these pin: the box appears only where the backend says a code can be
 * applied, the backend's own refusal wording reaches the buyer, and an accepted
 * code lands in the selection — which is what re-prices the quote and, through it,
 * the PaymentIntent. A discount the buyer sees but is not charged is the failure
 * mode worth testing for.
 */

const getConfig = vi.fn<(product: CertProductSlug) => Promise<CertConfig>>();
const getQuote =
  vi.fn<(product: CertProductSlug, selection: CertSelection) => Promise<CertQuote>>();
const applyCoupon = vi.fn();

vi.mock("@/lib/services/certificate", () => ({
  certificateService: {
    getConfig: (product: CertProductSlug) => getConfig(product),
    getQuote: (product: CertProductSlug, selection: CertSelection) => getQuote(product, selection),
    createIntent: vi.fn(),
    confirm: vi.fn(),
  },
}));

vi.mock("@/lib/services/forms", async () => {
  const actual = await vi.importActual<FormsModule>("@/lib/services/forms");
  return {
    ...actual,
    formsService: { applyCoupon: (...args: unknown[]) => applyCoupon(...args) },
  };
});

vi.mock("@/lib/stripe", () => ({ stripePromise: Promise.resolve(null) }));
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useStripe: () => null,
  useElements: () => null,
  CardNumberElement: () => <div data-testid="card-number" />,
  CardExpiryElement: () => <div data-testid="card-expiry" />,
  CardCvcElement: () => <div data-testid="card-cvc" />,
}));

const COUPON_FIELD = { fieldId: 73, name: "input_73", label: "Coupon" };

function quote(overrides: Partial<CertQuote> = {}): CertQuote {
  return {
    available: true,
    currency: "GBP",
    items: [],
    subtotal: 29.98,
    shipping: 2.99,
    coupons: [],
    discount: 0,
    total: 32.97,
    total_minor: 3297,
    ...overrides,
  };
}

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CertificateForm product="default" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  getConfig.mockReset();
  getQuote.mockReset();
  applyCoupon.mockReset();
  getQuote.mockResolvedValue(quote());
  getConfig.mockResolvedValue({ ...CERT_CONFIG_23, coupon: COUPON_FIELD });
});

describe("coupon box visibility", () => {
  it("renders when the backend advertises a coupon field", async () => {
    renderForm();
    expect(await screen.findByLabelText("Coupon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
  });

  it("renders nothing when the form takes no coupons", async () => {
    // The backend sends null both for "no coupon field" and "add-on inactive" —
    // a box whose Apply could never succeed is worse than no box.
    getConfig.mockResolvedValue({ ...CERT_CONFIG_23, coupon: null });
    renderForm();

    await screen.findByText(CERT_CONFIG_23.products[0].label);
    expect(screen.queryByLabelText("Coupon")).not.toBeInTheDocument();
  });

  it("renders nothing for a plugin build that predates coupon support", async () => {
    const { coupon: _omitted, ...withoutCouponKey } = { ...CERT_CONFIG_23, coupon: COUPON_FIELD };
    getConfig.mockResolvedValue(withoutCouponKey as CertConfig);
    renderForm();

    await screen.findByText(CERT_CONFIG_23.products[0].label);
    expect(screen.queryByLabelText("Coupon")).not.toBeInTheDocument();
  });
});

describe("nothing to discount yet", () => {
  it("disables Apply while the order totals £0", async () => {
    // A code applied to a £0 order can only be refused, and every attempt spends
    // one of the visitor's rate-limited tries.
    getQuote.mockResolvedValue(quote({ subtotal: 0, shipping: 0, total: 0, total_minor: 0 }));

    renderForm();
    await screen.findByLabelText("Coupon");

    await waitFor(() => expect(screen.getByRole("button", { name: /apply/i })).toBeDisabled());
    expect(screen.getByLabelText("Coupon")).toBeDisabled();
    expect(
      screen.getByText("Select a certificate option before applying a coupon."),
    ).toBeInTheDocument();
    expect(applyCoupon).not.toHaveBeenCalled();
  });

  it("enables Apply once the order has a price", async () => {
    renderForm();
    await screen.findByLabelText("Coupon");

    await waitFor(() => expect(screen.getByRole("button", { name: /apply/i })).toBeEnabled());
    expect(
      screen.queryByText("Select a certificate option before applying a coupon."),
    ).not.toBeInTheDocument();
  });
});

describe("applying a code", () => {
  it("sends the code to the backend and lists it once accepted", async () => {
    applyCoupon.mockResolvedValue({
      coupon: { code: "SAVE10", name: "Ten off", type: "flat", amount: 10 },
      applied: ["SAVE10"],
      field: { id: 73, name: "input_73" },
      totals: null,
    });

    renderForm();
    fireEvent.change(await screen.findByLabelText("Coupon"), { target: { value: "save10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    await screen.findByText("SAVE10");

    const [formId, payload] = applyCoupon.mock.calls[0] as [number, { code: string }];
    // Form 23's own id — a coupon feed is scoped to a form, so the wrong id
    // would reject a perfectly good code.
    expect(formId).toBe(CERT_CONFIG_23.form_id);
    expect(payload.code).toBe("save10");
    // The input clears so the next code can be typed.
    expect(screen.getByLabelText("Coupon")).toHaveValue("");
  });

  it("re-quotes with the accepted code in the selection", async () => {
    applyCoupon.mockResolvedValue({
      coupon: { code: "SAVE10", name: "Ten off", type: "flat", amount: 10 },
      applied: ["SAVE10"],
      field: { id: 73, name: "input_73" },
      totals: null,
    });
    getQuote.mockResolvedValue(
      quote({
        discount: 10,
        total: 22.97,
        total_minor: 2297,
        coupons: [{ code: "SAVE10", name: "Ten off", type: "flat", amount: 10, discount: 10 }],
      }),
    );

    renderForm();
    fireEvent.change(await screen.findByLabelText("Coupon"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    // The code has to be in the selection, not held beside it: the selection is
    // what prices the PaymentIntent, so a code that never gets there means the
    // buyer is charged the undiscounted total.
    await waitFor(() => {
      const withCodes = getQuote.mock.calls.some(([, selection]) =>
        selection.coupons?.includes("SAVE10"),
      );
      expect(withCodes).toBe(true);
    });
  });

  it("shows the backend's refusal wording, not a paraphrase", async () => {
    applyCoupon.mockRejectedValue(new CouponError("This coupon has expired.", "SAVE10"));

    renderForm();
    fireEvent.change(await screen.findByLabelText("Coupon"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(await screen.findByText("This coupon has expired.")).toBeInTheDocument();
    expect(screen.queryByText("SAVE10")).not.toBeInTheDocument();
  });

  it("keeps the server's list of applied codes, not a local append", async () => {
    // The server judged the stacking and may have normalised or superseded what
    // we hold; a local append would price one thing and display another.
    applyCoupon.mockResolvedValue({
      coupon: { code: "SAVE10", name: "Ten off", type: "flat", amount: 10 },
      applied: ["save10"],
      field: { id: 73, name: "input_73" },
      totals: null,
    });

    renderForm();
    fireEvent.change(await screen.findByLabelText("Coupon"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    // Listed once — case is the server's business, not a second entry.
    expect(await screen.findByText("SAVE10")).toBeInTheDocument();
    await waitFor(() => {
      const withCodes = getQuote.mock.calls.some(
        ([, selection]) => selection.coupons?.length === 1,
      );
      expect(withCodes).toBe(true);
    });
  });

  it("re-prices without a code once it is removed", async () => {
    applyCoupon.mockResolvedValue({
      coupon: { code: "SAVE10", name: "Ten off", type: "flat", amount: 10 },
      applied: ["SAVE10"],
      field: { id: 73, name: "input_73" },
      totals: null,
    });

    renderForm();
    fireEvent.change(await screen.findByLabelText("Coupon"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    await screen.findByText("SAVE10");

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(await screen.findByText("£32.97")).toBeInTheDocument();
    expect(screen.queryByText("SAVE10")).not.toBeInTheDocument();
    // The quote after the removal carries no codes at all — the total returning
    // to its old value has to come from the backend, not from dropping a line.
    await waitFor(() => {
      const [, selection] = getQuote.mock.calls[getQuote.mock.calls.length - 1];
      expect(selection.coupons ?? []).toEqual([]);
    });
  });

  it("does not blame the code when the apply request itself fails", async () => {
    // A 503 or a dropped connection says nothing about the code. Telling the
    // visitor it was refused sends them off to find another perfectly good one.
    applyCoupon.mockRejectedValue(
      new ApiError({
        status: 503,
        code: "lms_coupons_unavailable",
        message: "Fatal error: Uncaught Error in /var/www/html/wp-content/plugins/x.php on line 42",
      }),
    );

    renderForm();
    fireEvent.change(await screen.findByLabelText("Coupon"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(
      await screen.findByText("Could not apply that code. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/wp-content/)).not.toBeInTheDocument();
  });

  it("does not call the backend with an empty box", async () => {
    renderForm();
    await screen.findByLabelText("Coupon");
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(applyCoupon).not.toHaveBeenCalled();
    expect(await screen.findByText("Enter a coupon code.")).toBeInTheDocument();
  });
});

describe("a quote the backend refuses over a coupon", () => {
  it("shows the backend's reason instead of a full-price total", async () => {
    // The quote re-checks every code, so one that expires mid-session surfaces
    // here. Silently showing the pre-coupon total would let the buyer pay a
    // price they never agreed to.
    getQuote.mockRejectedValue(
      new ApiError({
        status: 422,
        code: "lms_coupon_invalid",
        message: "This coupon has reached its usage limit.",
      }),
    );

    renderForm();

    expect(await screen.findByText("This coupon has reached its usage limit.")).toBeInTheDocument();
    // No total the visitor could pay at, and nothing to press: a refused quote
    // priced nothing, and "£0.00" beside an enabled Pay button is an offer.
    expect(await screen.findByText("—")).toBeInTheDocument();
    expect(screen.queryByText("£0.00")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /^Pay$/ })).toBeDisabled());
  });

  it("does not show a server failure's own words to the buyer", async () => {
    // Only a refusal (422) speaks to the buyer. Anything else is ours, and its
    // raw text is neither actionable nor safe to render.
    getQuote.mockRejectedValue(
      new ApiError({
        status: 500,
        code: "internal_server_error",
        message: "Request failed with status code 500",
      }),
    );

    renderForm();

    // Waits past the one retry a transient failure is given.
    expect(
      await screen.findByText(
        "We could not price this order just now. Please try again.",
        {},
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();
    expect(getQuote.mock.calls.length).toBeGreaterThan(1);
    expect(screen.queryByText(/status code 500/)).not.toBeInTheDocument();
  });
});

describe("totals", () => {
  it("shows the discount line and the backend's discounted total", async () => {
    applyCoupon.mockResolvedValue({
      coupon: { code: "SAVE10", name: "Ten off", type: "flat", amount: 10 },
      applied: ["SAVE10"],
      field: { id: 73, name: "input_73" },
      totals: null,
    });
    getQuote.mockResolvedValue(
      quote({
        discount: 10,
        total: 22.97,
        total_minor: 2297,
        coupons: [{ code: "SAVE10", name: "Ten off", type: "flat", amount: 10, discount: 10 }],
      }),
    );

    renderForm();
    fireEvent.change(await screen.findByLabelText("Coupon"), { target: { value: "SAVE10" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(await screen.findByText("Discount")).toBeInTheDocument();
    expect(await screen.findByText("−£10.00")).toBeInTheDocument();
    // The displayed total is the backend's, never subtotal − discount computed here.
    expect(await screen.findByText("£22.97")).toBeInTheDocument();
  });

  it("shows no discount line before any code is applied", async () => {
    renderForm();
    await screen.findByText("Total Fee");

    expect(screen.queryByText("Discount")).not.toBeInTheDocument();
  });
});
