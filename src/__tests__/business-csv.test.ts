import { describe, expect, it } from "vitest";
import {
  buildImportRows,
  defaultMapping,
  detectHeaderRow,
  mappingFromHeader,
  parseCsv,
} from "@/lib/utils/business-csv";

describe("parseCsv", () => {
  it("trims cells, strips surrounding quotes and drops blank lines", () => {
    const rows = parseCsv('First, Last ,Email\n\n"Ayan", Ahmed ,ayan@example.test\n');

    expect(rows).toEqual([
      ["First", "Last", "Email"],
      ["Ayan", "Ahmed", "ayan@example.test"],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("returns no rows for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("detectHeaderRow", () => {
  it("recognises a header whose every cell names a known column", () => {
    expect(detectHeaderRow(["First name", "Last Name", "Email address"])).toBe(true);
  });

  it("rejects a row containing a value that is not a column name", () => {
    expect(detectHeaderRow(["Ayan", "Ahmed", "ayan@example.test"])).toBe(false);
  });

  it("rejects a single-cell row, which is too weak a signal", () => {
    expect(detectHeaderRow(["Email"])).toBe(false);
  });
});

describe("mappingFromHeader", () => {
  it("maps known headers and skips the rest", () => {
    expect(mappingFromHeader(["Surname", "E-mail Address", "Notes"])).toEqual([
      "last",
      "email",
      "skip",
    ]);
  });
});

describe("defaultMapping", () => {
  it("falls back to positional columns and skips the overflow", () => {
    expect(defaultMapping(6)).toEqual(["first", "last", "email", "dept", "skip", "skip"]);
  });
});

describe("buildImportRows", () => {
  it("projects rows through the mapping", () => {
    const rows = [["Ayan", "Ahmed", "ayan@example.test", "Care"]];

    expect(buildImportRows(rows, ["first", "last", "email", "dept"])).toEqual([
      { first: "Ayan", last: "Ahmed", email: "ayan@example.test", dept: "Care" },
    ]);
  });

  it("keeps the first column when a role is mapped twice", () => {
    const rows = [["primary@example.test", "secondary@example.test"]];

    expect(buildImportRows(rows, ["email", "email"])[0].email).toBe("primary@example.test");
  });

  it("yields empty strings for columns the row is missing", () => {
    expect(buildImportRows([["Ayan"]], ["first", "last", "email", "dept"])).toEqual([
      { first: "Ayan", last: "", email: "", dept: "" },
    ]);
  });
});
