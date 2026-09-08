import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  CertificatePageShell,
  type CertificatePageDefaults,
} from "@/components/certificate/certificate-page-shell";
import type { CertPageContent } from "@/types/certificate";

// The order form has its own coverage and needs Stripe; stub it out here so these
// tests are only about content sourcing and per-field fallback.
vi.mock("@/components/certificate/certificate-form", () => ({
  CertificateForm: ({ product }: { product?: string }) => (
    <div data-testid="order-form" data-product={product} />
  ),
}));

const DEFAULTS: CertificatePageDefaults = {
  heroHeading: "Order Hardcopy Certificate",
  heroText: "Power Your Professional Growth with CPD Certification & Transcript",
  benefits: ["Showcase Your Professional Growth", "Strengthen Your CV & Career Opportunities"],
  orderHeading: "Order Your Hardcopy Certificate",
  promoLabel: "Promotional Banner",
  heroImages: [
    {
      src: "/images/certificate/hero-certificate.jpg",
      alt: "Sample certificate",
      width: 306,
      height: 231,
    },
    {
      src: "/images/certificate/hero-transcript.jpg",
      alt: "Sample transcript",
      width: 196,
      height: 260,
    },
  ],
};

/** The documented "nothing configured" response from `GET /certificate/{product}/page`. */
const EMPTY_CONTENT: CertPageContent = {
  product: "hardcopy",
  hero: { heading: "", text: "", benefits: [], images: [] },
  orderSection: { heading: "" },
  promoBanner: { image: null, heading: "" },
};

function renderShell(content: CertPageContent | null) {
  return render(<CertificatePageShell product="hardcopy" content={content} defaults={DEFAULTS} />);
}

describe("certificate page shell — content fallback", () => {
  it("renders every static default when the content fetch fails", () => {
    renderShell(null);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Order Hardcopy Certificate",
    );
    expect(screen.getByText(DEFAULTS.heroText!)).toBeInTheDocument();
    expect(screen.getByText("Order Your Hardcopy Certificate")).toBeInTheDocument();
    expect(screen.getByText("Promotional Banner")).toBeInTheDocument();
    for (const benefit of DEFAULTS.benefits) {
      expect(screen.getByText(benefit)).toBeInTheDocument();
    }
  });

  it("renders identically for the documented empty-content shape", () => {
    renderShell(EMPTY_CONTENT);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Order Hardcopy Certificate",
    );
    expect(screen.getByText("Order Your Hardcopy Certificate")).toBeInTheDocument();
    expect(screen.getByText(DEFAULTS.benefits[0])).toBeInTheDocument();
  });

  it("falls back per field — a configured heading does not blank the benefits", () => {
    renderShell({
      ...EMPTY_CONTENT,
      hero: { heading: "Get Your Printed Certificate", text: "", benefits: [], images: [] },
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Get Your Printed Certificate",
    );
    expect(screen.getByText(DEFAULTS.benefits[0])).toBeInTheDocument();
    expect(screen.getByText(DEFAULTS.heroText!)).toBeInTheDocument();
  });

  it("uses API content for every field it supplies", () => {
    renderShell({
      product: "hardcopy",
      hero: {
        heading: "CMS Heading",
        text: "CMS supporting line",
        benefits: ["CMS benefit"],
        images: [{ url: "https://cdn.test/a.jpg", alt: "CMS hero image" }],
      },
      orderSection: { heading: "CMS Order Heading" },
      promoBanner: { image: null, heading: "CMS Promo" },
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("CMS Heading");
    expect(screen.getByText("CMS supporting line")).toBeInTheDocument();
    expect(screen.getByText("CMS benefit")).toBeInTheDocument();
    expect(screen.getByText("CMS Order Heading")).toBeInTheDocument();
    expect(screen.getByText("CMS Promo")).toBeInTheDocument();
    expect(screen.getByAltText("CMS hero image")).toBeInTheDocument();
    expect(screen.queryByAltText("Sample certificate")).not.toBeInTheDocument();
  });

  it("renders the bundled mockups when the API supplies no hero images", () => {
    renderShell(EMPTY_CONTENT);
    expect(screen.getByAltText("Sample certificate")).toBeInTheDocument();
    expect(screen.getByAltText("Sample transcript")).toBeInTheDocument();
  });

  it("ignores content the backend served for the other product", () => {
    // Only reachable if the endpoint aliased this slug onto another offer's ACF
    // record — the path scoping should already have prevented it.
    renderShell({
      product: "default",
      hero: {
        heading: "Certificate page heading",
        text: "",
        benefits: [],
        images: [{ url: "https://cdn.test/other.jpg", alt: "Other offer image" }],
      },
      orderSection: { heading: "Order Your New Certificate" },
      promoBanner: {
        image: { url: "https://cdn.test/promo.jpg", alt: "Other promo" },
        heading: "",
      },
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Order Hardcopy Certificate",
    );
    expect(screen.getByText("Order Your Hardcopy Certificate")).toBeInTheDocument();
    expect(screen.queryByAltText("Other offer image")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Other promo")).not.toBeInTheDocument();
    expect(screen.getByAltText("Sample certificate")).toBeInTheDocument();
  });

  it("accepts content that names its own product", () => {
    renderShell({
      product: "hardcopy",
      hero: { heading: "Hardcopy CMS Heading", text: "", benefits: [], images: [] },
      orderSection: { heading: "" },
      promoBanner: { image: null, heading: "" },
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hardcopy CMS Heading");
  });

  it("passes its product down to the order form", () => {
    renderShell(null);
    expect(screen.getByTestId("order-form")).toHaveAttribute("data-product", "hardcopy");
  });

  it("omits the supporting line entirely when there is none", () => {
    const { container } = render(
      <CertificatePageShell
        product="default"
        content={null}
        defaults={{ ...DEFAULTS, heroText: undefined }}
      />,
    );
    expect(container.querySelector("h1 + p")).toBeNull();
  });
});
