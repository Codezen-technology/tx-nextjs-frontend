import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryWhyChooseUs } from "@/components/courses/category-why-choose-us";
import { TrustedOrgs } from "@/components/home/trusted-orgs";

/**
 * `next/image` is stubbed to a plain `<img>`. These tests are about which
 * element exists and what its wrapper is sized by, not about the optimizer.
 * `fill` is dropped so React does not warn about an unknown DOM attribute.
 */
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    fill: _fill,
    ...rest
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    [k: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

const IMAGE = "https://cdn.example.test/animal-care.jpg";

describe("CategoryWhyChooseUs", () => {
  it("renders the image, and its wrapper is not hidden at any width", () => {
    const { container } = render(
      <CategoryWhyChooseUs whyChooseUs={IMAGE} categoryName="Animal Care" />,
    );

    const img = screen.getByAltText("Animal Care courses");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", IMAGE);

    // The regression this guards: the wrapper used to carry `hidden lg:block`,
    // so the image never rendered below 1024px however the data looked.
    const wrapper = img.parentElement as HTMLElement;
    expect(wrapper.className).not.toMatch(/(^|\s)hidden(\s|$)/);
    expect(wrapper.className).toContain("aspect-[16/9]");
    expect(wrapper.className).toContain("lg:h-[312px]");
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("falls back to the gradient block and renders no image when none is supplied", () => {
    const { container } = render(<CategoryWhyChooseUs whyChooseUs={null} />);

    expect(container.querySelector("img")).toBeNull();
    const gradient = container.querySelector('[style*="linear-gradient"]');
    expect(gradient).not.toBeNull();
    expect((gradient!.parentElement as HTMLElement).className).not.toMatch(/(^|\s)hidden(\s|$)/);
  });

  it("keeps the image after the reason list in source order", () => {
    const { container } = render(<CategoryWhyChooseUs whyChooseUs={IMAGE} />);

    // `lg:flex-row` on the row puts the image to the right at desktop, so the
    // single DOM node serves both arrangements — no duplicated mobile copy.
    const row = container.querySelector(".lg\\:flex-row") as HTMLElement;
    const children = Array.from(row.children);
    expect(children).toHaveLength(2);
    expect(children[0].textContent).toContain("Expert Knowledge, Simplified");
    expect(children[1].querySelector("img")).not.toBeNull();
  });

  it("renders every reason", () => {
    render(<CategoryWhyChooseUs whyChooseUs={IMAGE} />);
    expect(screen.getByRole("heading", { name: "Why Choose Us?" })).toBeInTheDocument();
    expect(screen.getByText("Expert Knowledge, Simplified")).toBeInTheDocument();
    expect(screen.getByText("Up-to-Date Content")).toBeInTheDocument();
    expect(screen.getByText("Accredited & Trusted")).toBeInTheDocument();
  });
});

describe("TrustedOrgs", () => {
  it("renders nothing when the payload is absent", () => {
    const { container } = render(<TrustedOrgs data={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the organisation list is empty", () => {
    const { container } = render(
      <TrustedOrgs data={{ header: { title: "Trusted by" }, orgs: [] }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the band when organisations are supplied", () => {
    render(
      <TrustedOrgs
        data={{
          header: { title: "Trusted by Over 50,000 Organizations Worldwide" },
          orgs: [{ src: "/sponsors/a.png", alt: "Org A" }],
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Trusted by Over 50,000 Organizations Worldwide" }),
    ).toBeInTheDocument();
    // The track is doubled so the marquee can loop seamlessly.
    expect(screen.getAllByAltText("Org A")).toHaveLength(2);
  });
});
