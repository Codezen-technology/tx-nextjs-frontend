import { describe, expect, it } from "vitest";
import { buildPayload, isEmptyPayload } from "@/components/forms/gravity-form";
import type { GravityField, GravityForm } from "@/types/form";

const dateField = {
  id: "11",
  type: "date",
  name: "input_11",
  label: "Date of charge(s)",
  isRequired: true,
  placeholder: "",
  description: "",
  defaultValue: "",
  cssClass: "",
  size: "large",
  pageNumber: 1,
} as GravityField;

const hiddenIssueField = {
  id: "1",
  type: "hidden",
  name: "input_1",
  label: "Issue type",
  cssClass: "issue_type",
  isRequired: false,
  placeholder: "",
  description: "",
  defaultValue: "",
  size: "large",
  pageNumber: 1,
} as GravityField;

const fullNameField = {
  id: "2",
  type: "text",
  name: "input_2",
  label: "Full name",
  isRequired: true,
  placeholder: "",
  description: "",
  defaultValue: "",
  cssClass: "",
  size: "large",
  pageNumber: 1,
} as GravityField;

const supportForm: GravityForm = {
  id: 11,
  title: "Support Request (Headless)",
  description: "",
  button: { text: "Send" },
  hasPayment: false,
  isMultiPage: false,
  pageCount: 1,
  fields: [hiddenIssueField, fullNameField],
};

describe("buildPayload", () => {
  it("includes hidden wizard prefill when field is not in react-hook-form all", () => {
    const hiddenIds = new Set(["1"]);
    const visibleFields = [fullNameField];
    const all = { input_2: "Jane Smith" };
    const prefillValues = { input_1: "access" };

    const payload = buildPayload(supportForm.fields, visibleFields, all, hiddenIds, prefillValues);

    expect(payload).toEqual({
      input_1: "access",
      input_2: "Jane Smith",
    });
  });

  it("detects empty payload", () => {
    expect(isEmptyPayload({})).toBe(true);
    expect(isEmptyPayload({ input_2: "Jane" })).toBe(false);
  });

  it("normalizes date fields to yyyy-mm-dd", () => {
    const payload = buildPayload(
      [dateField],
      [dateField],
      { input_11: "1988-05-01T00:00:00.000Z" },
      new Set(),
    );
    expect(payload).toEqual({ input_11: "1988-05-01" });
  });

  it("uses JSON (not FormData) when a file field exists but no files were chosen", () => {
    const fileField = {
      id: "19",
      type: "fileupload",
      name: "input_19",
      label: "Attachments",
      isRequired: false,
      placeholder: "",
      description: "",
      defaultValue: "",
      cssClass: "",
      size: "large",
      pageNumber: 1,
    } as GravityField;

    const payload = buildPayload(
      [dateField, fileField],
      [dateField, fileField],
      { input_11: "1994-11-24" },
      new Set(),
    );

    expect(payload).toEqual({ input_11: "1994-11-24" });
    expect(payload).not.toBeInstanceOf(FormData);
  });
});
