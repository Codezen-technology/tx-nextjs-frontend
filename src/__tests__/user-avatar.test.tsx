import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserAvatar } from "@/components/ui/user-avatar";

/**
 * QA report, Homepage issue 1 — "the text on the circle is not properly
 * aligned".
 *
 * The circle is the header user avatar. `UserAvatar` applied its size class to
 * the fallback as well as to the root, so a caller that resized the root via
 * `className` left the fallback at the preset size: root `h-6 w-6` (24px) with
 * a `h-8 w-8` (32px) fallback inside it. The initial is centred in the 32px
 * box, which overflows the 24px circle — the glyph sits low and gets clipped by
 * the root's `overflow-hidden`.
 *
 * The fallback must therefore never carry its own dimensions; it inherits the
 * root's through `h-full w-full`. Asserted on the class list because jsdom has
 * no layout — the failure this guards is a size class surviving the merge, and
 * that is visible in the markup.
 */
const SIZED = /^[hw]-(?!full)/;

describe("UserAvatar", () => {
  it("sizes the fallback from the root, not from the size preset", async () => {
    render(<UserAvatar user={{ display_name: "Osman Sufy" }} size="sm" className="h-6 w-6" />);

    const fallback = await screen.findByText("OS");
    const sized = [...fallback.classList].filter((c) => SIZED.test(c));

    expect(
      sized,
      `fallback carries its own dimensions ${sized.join(" ")} — it must inherit the root's via h-full w-full, or the initial centres in the wrong box`,
    ).toEqual([]);
    expect(fallback.className).toContain("h-full");
    expect(fallback.className).toContain("w-full");
  });

  it("still centres the initial", async () => {
    render(<UserAvatar user={{ display_name: "Osman Sufy" }} size="lg" className="h-10 w-10" />);

    const fallback = await screen.findByText("OS");
    expect(fallback.className).toContain("items-center");
    expect(fallback.className).toContain("justify-center");
  });
});
