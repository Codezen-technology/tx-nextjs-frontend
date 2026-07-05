import { describe, expect, it } from "vitest";
import {
  checkoutFieldAutoComplete,
  checkoutFieldGridClass,
} from "@/lib/utils/checkout-field-layout";

describe("checkoutFieldGridClass", () => {
  it("returns full-width span for form-row-wide", () => {
    expect(checkoutFieldGridClass(["form-row-wide"])).toBe("sm:col-span-2");
  });

  it("returns empty string for first/last half-width rows", () => {
    expect(checkoutFieldGridClass(["form-row-first"])).toBe("");
    expect(checkoutFieldGridClass(["form-row-last"])).toBe("");
  });
});

describe("checkoutFieldAutoComplete", () => {
  it("maps known billing keys", () => {
    expect(checkoutFieldAutoComplete("first_name")).toBe("given-name");
    expect(checkoutFieldAutoComplete("email")).toBe("email");
    expect(checkoutFieldAutoComplete("postcode")).toBe("postal-code");
  });

  it("returns undefined for unknown keys", () => {
    expect(checkoutFieldAutoComplete("company")).toBeUndefined();
  });
});
