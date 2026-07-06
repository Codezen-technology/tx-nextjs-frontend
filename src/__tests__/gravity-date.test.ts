import { describe, expect, it } from "vitest";
import { isValidGravityDate, toGravityDateString } from "@/lib/utils/gravity-date";

describe("toGravityDateString", () => {
  it("passes through yyyy-mm-dd", () => {
    expect(toGravityDateString("1988-05-01")).toBe("1988-05-01");
  });

  it("extracts date from ISO datetime", () => {
    expect(toGravityDateString("1988-05-01T00:00:00.000Z")).toBe("1988-05-01");
  });

  it("trims whitespace", () => {
    expect(toGravityDateString(" 1988-05-01 ")).toBe("1988-05-01");
  });

  it("converts slash dates (en-GB dd/mm/yyyy)", () => {
    expect(toGravityDateString("05/01/1988")).toBe("1988-01-05");
  });
});

describe("isValidGravityDate", () => {
  it("accepts valid calendar dates", () => {
    expect(isValidGravityDate("1988-05-01")).toBe(true);
  });

  it("rejects invalid calendar dates", () => {
    expect(isValidGravityDate("1988-02-31")).toBe(false);
  });
});
