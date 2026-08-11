import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FallbackImage } from "@/components/ui/fallback-image";

/**
 * `next/image` is stubbed down to a plain `<img>`: the real component's
 * optimizer URL rewriting and lazy-loading are Next.js concerns, and what these
 * tests need to drive is the `onError` path, which jsdom never fires on its own.
 */
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    onError,
    ...rest
  }: {
    src: string;
    alt: string;
    onError?: () => void;
    [k: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={onError} {...rest} />
  ),
}));

const REAL = "https://cdn.example.test/real.png";
const FALLBACK = "/images/placeholder.jpg";

const img = () => screen.queryByRole("img");
const fail = () => fireEvent.error(screen.getByRole("img"));

describe("FallbackImage — resolution order", () => {
  it("renders the CMS source when it loads", () => {
    render(
      <FallbackImage
        src={REAL}
        fallbackSrc={FALLBACK}
        alt="Certificate"
        width={280}
        height={396}
      />,
    );
    expect(img()).toHaveAttribute("src", REAL);
  });

  it("swaps to fallbackSrc when the CMS source fails", () => {
    render(
      <FallbackImage
        src={REAL}
        fallbackSrc={FALLBACK}
        alt="Certificate"
        width={280}
        height={396}
      />,
    );
    fail();
    expect(img()).toHaveAttribute("src", FALLBACK);
  });

  it("renders nothing when the source fails and there is no fallback", () => {
    render(<FallbackImage src={REAL} alt="Team photo" width={306} height={200} />);
    fail();
    expect(img()).not.toBeInTheDocument();
  });

  it("gives up rather than looping when the fallback fails too", () => {
    render(
      <FallbackImage
        src={REAL}
        fallbackSrc={FALLBACK}
        alt="Certificate"
        width={280}
        height={396}
      />,
    );
    fail(); // CMS source
    expect(img()).toHaveAttribute("src", FALLBACK);
    fail(); // fallback
    expect(img()).not.toBeInTheDocument();
  });

  it("renders the fallback node once every image source is exhausted", () => {
    render(
      <FallbackImage
        src={REAL}
        fallbackSrc={FALLBACK}
        fallback={<div data-testid="placeholder" />}
        alt="About Us"
        width={400}
        height={300}
      />,
    );
    fail();
    fail();
    expect(img()).not.toBeInTheDocument();
    expect(screen.getByTestId("placeholder")).toBeInTheDocument();
  });
});

describe("FallbackImage — unusable src", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty string", ""],
    ["whitespace", "   "],
    ["a bare filename", "cert.png"],
  ])("skips straight to the fallback for %s", (_label, bad) => {
    render(
      <FallbackImage src={bad} fallbackSrc={FALLBACK} alt="Certificate" width={280} height={396} />,
    );
    expect(img()).toHaveAttribute("src", FALLBACK);
  });

  it("renders the fallback node when src is unusable and there is no fallbackSrc", () => {
    render(
      <FallbackImage
        src={null}
        fallback={<div data-testid="placeholder" />}
        alt="About Us"
        width={400}
        height={300}
      />,
    );
    expect(img()).not.toBeInTheDocument();
    expect(screen.getByTestId("placeholder")).toBeInTheDocument();
  });

  it("renders nothing at all when src is unusable and nothing is configured", () => {
    const { container } = render(<FallbackImage src={null} alt="" width={10} height={10} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("FallbackImage — layout box", () => {
  it("forwards width, height and className so the reserved box survives a swap", () => {
    render(
      <FallbackImage
        src={REAL}
        fallbackSrc={FALLBACK}
        alt="Certificate"
        width={280}
        height={396}
        className="h-auto w-70"
      />,
    );
    fail();
    const el = img();
    expect(el).toHaveAttribute("width", "280");
    expect(el).toHaveAttribute("height", "396");
    expect(el).toHaveClass("h-auto", "w-70");
  });
});
