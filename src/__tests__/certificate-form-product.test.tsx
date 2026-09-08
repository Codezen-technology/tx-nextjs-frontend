import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CertificateForm } from "@/components/certificate/certificate-form";
import { CERT_CONFIG_22, CERT_CONFIG_23 } from "./fixtures/certificate-config";
import type { CertConfig, CertProductSlug } from "@/types/certificate";

/**
 * `/certificate` and `/hardcopy-certificate` share this component, so what each
 * page sells is decided entirely by the product's backend config. These tests pin
 * the parts that array-position logic used to get wrong.
 */

const getConfig = vi.fn<(product: CertProductSlug) => Promise<CertConfig>>();
const getQuote = vi.fn(async () => ({
  available: true,
  currency: "GBP",
  items: [],
  subtotal: 0,
  shipping: 0,
  total: 0,
  total_minor: 0,
}));

vi.mock("@/lib/services/certificate", () => ({
  certificateService: {
    getConfig: (product: CertProductSlug) => getConfig(product),
    getQuote: () => getQuote(),
    createIntent: vi.fn(),
    confirm: vi.fn(),
  },
}));

// Stripe Elements need a real Elements provider otherwise; stub the surface used.
vi.mock("@/lib/stripe", () => ({ stripePromise: Promise.resolve(null) }));
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useStripe: () => null,
  useElements: () => null,
  CardNumberElement: () => <div data-testid="card-number" />,
  CardExpiryElement: () => <div data-testid="card-expiry" />,
  CardCvcElement: () => <div data-testid="card-cvc" />,
}));

function renderForm(product: CertProductSlug) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CertificateForm product={product} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  getConfig.mockReset();
  getQuote.mockClear();
});

describe("hardcopy product", () => {
  beforeEach(() => {
    getConfig.mockResolvedValue(CERT_CONFIG_22);
  });

  it("requests the config for its own product", async () => {
    renderForm("hardcopy");
    await waitFor(() => expect(getConfig).toHaveBeenCalledWith("hardcopy"));
  });

  it("renders the hardcopy product group above the digital one", async () => {
    const { container } = renderForm("hardcopy");
    await screen.findByText("Hardcopy CPD Certificate");

    const legends = Array.from(container.querySelectorAll("legend")).map((l) => l.textContent);
    expect(legends.indexOf("Hardcopy CPD Certificate")).toBeLessThan(
      legends.indexOf("Digital Transcript"),
    );
  });

  it("offers the digital transcript opt-out", async () => {
    renderForm("hardcopy");
    expect(await screen.findByLabelText("I don't need digital Transcript")).toBeInTheDocument();
  });

  it("pre-selects nothing in the hardcopy group — the plugin marks it required", async () => {
    renderForm("hardcopy");
    await screen.findByText("Hardcopy CPD Certificate");

    const hardcopyRadios = screen.getAllByRole<HTMLInputElement>("radio", {
      name: /certificate for £14\.99|transcript for £14\.99|Save 33%/,
    });
    expect(hardcopyRadios.every((r) => !r.checked)).toBe(true);
  });

  it("defaults the digital transcript to its £0 opt-out", async () => {
    renderForm("hardcopy");
    const optOut = await screen.findByLabelText<HTMLInputElement>(
      "I don't need digital Transcript",
    );
    expect(optOut.checked).toBe(true);
  });

  it("does not quote until the required group is chosen", async () => {
    // The backend rejects an unpriceable selection with 400
    // (`lms_cert_invalid_selection`), and on this page that is the *initial* state —
    // the hardcopy group has no £0 option to default to. Quoting eagerly fired a
    // known-invalid request on mount and on every keystroke after it.
    renderForm("hardcopy");
    await screen.findByText("Hardcopy CPD Certificate");
    expect(getQuote).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("CPD Accredited Certificate for £14.99"));
    await waitFor(() => expect(getQuote).toHaveBeenCalled());
  });

  it("blocks payment until a hardcopy option is chosen", async () => {
    renderForm("hardcopy");
    fireEvent.click(await screen.findByRole("button", { name: /^Pay/ }));
    expect(await screen.findByText(/Hardcopy CPD Certificate is required/i)).toBeInTheDocument();
  });

  it("hides shipping until a hardcopy option is chosen", async () => {
    renderForm("hardcopy");
    await screen.findByText("Hardcopy CPD Certificate");
    // The digital transcript is priced but not shippable — position-based logic
    // treated it as the hardcopy product here and revealed shipping too early.
    expect(screen.queryByText("Select shipping…")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("CPD Accredited Certificate for £14.99"));
    expect(await screen.findByText("Select shipping…")).toBeInTheDocument();
  });

  it("renders the delivery address and course fields from form 22", async () => {
    renderForm("hardcopy");
    await screen.findByText("Hardcopy CPD Certificate");

    // Address 44's six sub-inputs (form 23's address is field 78 — same labels,
    // different POST names; the name mapping is pinned in certificate-product.test).
    expect(screen.getByText("Certificate Delivery Address")).toBeInTheDocument();
    for (const label of ["Street Address", "City", "ZIP / Postal Code", "Country"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("Course(s) Name")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
  });
});

describe("hardcopy product — fail closed", () => {
  it("shows the unavailable state when the plugin does not serve the product", async () => {
    // Scoping is a path segment, so a plugin build without
    // `/certificate/hardcopy/config` answers 404 — never the other offer's prices.
    getConfig.mockRejectedValue(new Error("404 rest_no_route"));
    renderForm("hardcopy");

    expect(await screen.findByText(/ordering is unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText("Digital Version (PDF)")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Pay/ })).not.toBeInTheDocument();
  });

  it("never renders the other offer's products under the hardcopy heading", async () => {
    getConfig.mockRejectedValue(new Error("404 rest_no_route"));
    renderForm("hardcopy");

    await screen.findByText(/ordering is unavailable/i);
    expect(screen.queryByText("Hardcopy (Officially Printed)")).not.toBeInTheDocument();
  });
});

describe("certificate product is unaffected", () => {
  beforeEach(() => {
    getConfig.mockResolvedValue(CERT_CONFIG_23);
  });

  it("renders against the plugin's unscoped alias", async () => {
    renderForm("default");
    expect(await screen.findByText("Digital Version (PDF)")).toBeInTheDocument();
    expect(screen.queryByText(/ordering is unavailable/i)).not.toBeInTheDocument();
  });

  it("keeps the digital group first and both products defaulted to £0", async () => {
    const { container } = renderForm("default");
    await screen.findByText("Digital Version (PDF)");

    const legends = Array.from(container.querySelectorAll("legend")).map((l) => l.textContent);
    expect(legends.indexOf("Digital Version (PDF)")).toBeLessThan(
      legends.indexOf("Hardcopy (Officially Printed)"),
    );

    expect(
      screen.getByLabelText<HTMLInputElement>("I don't need digital Certificate & Transcript")
        .checked,
    ).toBe(true);
    expect(
      screen.getByLabelText<HTMLInputElement>("I don't need Officially Printed Hardcopy").checked,
    ).toBe(true);
  });

  it("quotes immediately — both of its groups default to a £0 opt-out", async () => {
    renderForm("default");
    await screen.findByText("Digital Version (PDF)");
    await waitFor(() => expect(getQuote).toHaveBeenCalled());
  });

  it("still gates shipping on its hardcopy product, which is products[1]", async () => {
    renderForm("default");
    await screen.findByText("Hardcopy (Officially Printed)");
    expect(screen.queryByText("Select shipping…")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("CPD Accredited Certificate for £14.99"));
    expect(await screen.findByText("Select shipping…")).toBeInTheDocument();
  });
});
