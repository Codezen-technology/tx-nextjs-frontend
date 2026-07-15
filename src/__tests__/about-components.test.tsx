import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AboutBreadcrumb } from "@/components/about/about-breadcrumb";
import { AboutHero } from "@/components/about/about-hero";
import { AboutCommitmentSection } from "@/components/about/about-commitment-section";
import { AboutValuesGrid } from "@/components/about/about-values-grid";
import { AboutTeamSection } from "@/components/about/about-team-section";
import { ABOUT_PAGE_DEFAULTS, getAboutPage } from "@/lib/services/about";

vi.mock("@/lib/api/server", () => ({
  serverApi: {
    about: { get: vi.fn() },
  },
}));

describe("AboutBreadcrumb", () => {
  it("renders Home link and the current page label", () => {
    render(<AboutBreadcrumb />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByText("About us")).toHaveAttribute("aria-current", "page");
  });
});

describe("AboutHero", () => {
  it("renders eyebrow, heading, subheading, and both CTAs with configured hrefs", () => {
    render(<AboutHero data={ABOUT_PAGE_DEFAULTS.hero} />);
    expect(screen.getByText("About us")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Empowering Careers, Ensuring Compliance.",
    );
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/all-courses",
    );
    expect(screen.getByRole("link", { name: "Chat to sales" })).toHaveAttribute(
      "href",
      "/contact-us",
    );
  });
});

describe("AboutCommitmentSection", () => {
  it("renders the section heading and every block's heading, text, and check items", () => {
    render(<AboutCommitmentSection data={ABOUT_PAGE_DEFAULTS.commitment_section} />);
    expect(screen.getByText("Our Commitment to Excellence")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What We Offer?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Why Train with Us?" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Train Your Workforce with Confidence" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Compliance & Professional Development Training")).toBeInTheDocument();
  });

  it("renders a placeholder (no <img>) when a block's image is unset", () => {
    const { container } = render(
      <AboutCommitmentSection data={ABOUT_PAGE_DEFAULTS.commitment_section} />,
    );
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("renders a real <img> when a block's image is set", () => {
    const data = {
      ...ABOUT_PAGE_DEFAULTS.commitment_section,
      blocks: [
        { ...ABOUT_PAGE_DEFAULTS.commitment_section.blocks[0], image: "https://example.com/a.jpg" },
        ...ABOUT_PAGE_DEFAULTS.commitment_section.blocks.slice(1),
      ],
    };
    const { container } = render(<AboutCommitmentSection data={data} />);
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });
});

describe("AboutValuesGrid", () => {
  it("renders eyebrow, heading, and all six value cards", () => {
    render(<AboutValuesGrid data={ABOUT_PAGE_DEFAULTS.values} />);
    expect(screen.getByText("Our values")).toBeInTheDocument();
    for (const card of ABOUT_PAGE_DEFAULTS.values.cards) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
      expect(screen.getByText(card.description)).toBeInTheDocument();
    }
  });
});

describe("AboutTeamSection", () => {
  it("renders heading, text, and both CTAs", () => {
    render(<AboutTeamSection data={ABOUT_PAGE_DEFAULTS.team} />);
    expect(screen.getByRole("heading", { name: "We're just getting started" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "We're hiring!" })).toHaveAttribute(
      "href",
      "/contact-us?enquiry=careers",
    );
    expect(screen.getByRole("link", { name: "Read our principles" })).toHaveAttribute(
      "href",
      "/about-us#values",
    );
  });

  it("renders placeholders for all 5 slots when no photos are set", () => {
    const { container } = render(<AboutTeamSection data={ABOUT_PAGE_DEFAULTS.team} />);
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("renders a real <img> for a set photo slot", () => {
    const team = {
      ...ABOUT_PAGE_DEFAULTS.team,
      photos: ["https://example.com/team1.jpg", null, null, null, null],
    };
    const { container } = render(<AboutTeamSection data={team} />);
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });
});

describe("getAboutPage", () => {
  it("falls back to the Figma-derived defaults when the fetch fails", async () => {
    const { serverApi } = await import("@/lib/api/server");
    vi.mocked(serverApi.about.get).mockRejectedValueOnce(new Error("network error"));

    const result = await getAboutPage();

    expect(result).toEqual(ABOUT_PAGE_DEFAULTS);
  });

  it("returns the fetched data when the fetch succeeds", async () => {
    const { serverApi } = await import("@/lib/api/server");
    vi.mocked(serverApi.about.get).mockResolvedValueOnce(ABOUT_PAGE_DEFAULTS);

    const result = await getAboutPage();

    expect(result).toEqual(ABOUT_PAGE_DEFAULTS);
  });
});
