import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";

/**
 * The widget's *mount decision*, which is all this file can honestly cover.
 *
 * jsdom cannot execute the vendor bundle, so nothing here says anything about
 * the widget itself — that is `e2e/live-chat.spec.ts`'s job. What is worth
 * pinning at this level is the gate (`NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL` unset
 * must mean *no tag*, not a hidden one) and the fact that the tag carries
 * nothing about the visitor.
 *
 * `next/script` is mocked to a plain element rather than exercised for real:
 * outside a Next runtime its afterInteractive path injects through client
 * internals, and asserting on those would test Next rather than this
 * component's contract, which is "this src, this strategy, nothing else".
 */
vi.mock("next/script", () => ({
  default: (props: Record<string, unknown>) => (
    <script data-testid="live-chat-script" {...(props as Record<string, string>)} />
  ),
}));

async function renderWidget(url: string | undefined) {
  vi.resetModules();
  if (url === undefined) {
    vi.stubEnv("NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL", "");
  } else {
    vi.stubEnv("NEXT_PUBLIC_LIVE_CHAT_WIDGET_URL", url);
  }
  // Imported after the stub because `src/lib/env.ts` reads process.env once, at
  // module load.
  const { LiveChatWidget } = await import("@/components/live-chat/live-chat-widget");
  return render(<LiveChatWidget />);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("LiveChatWidget", () => {
  it("renders no script when no widget URL is configured", async () => {
    const { container } = await renderWidget(undefined);

    expect(container.querySelector("script")).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders exactly one script with the configured URL", async () => {
    const url = "https://chat-widget.example.test/widget.js";
    const { container } = await renderWidget(url);

    const scripts = container.querySelectorAll("script");
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toHaveAttribute("src", url);
  });

  it("loads after interactive so it cannot block first paint", async () => {
    const { getByTestId } = await renderWidget("https://chat-widget.example.test/widget.js");

    expect(getByTestId("live-chat-script")).toHaveAttribute("strategy", "afterInteractive");
  });

  it("passes no visitor or account data to the widget", async () => {
    const { getByTestId } = await renderWidget("https://chat-widget.example.test/widget.js");

    // Whitelist rather than a blacklist of PII-ish names: a future prop that
    // smuggles visitor data in under an unforeseen name should fail this too.
    const attributeNames = getByTestId("live-chat-script")
      .getAttributeNames()
      .filter((name) => name !== "data-testid");

    expect(attributeNames.sort()).toEqual(["src", "strategy"]);
  });
});
