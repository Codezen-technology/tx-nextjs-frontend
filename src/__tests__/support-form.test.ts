import { describe, expect, it } from "vitest";
import {
  CANCELLATIONS_ISSUE_GATE,
  SUPPORT_ISSUES,
  isSupportIssueSlug,
} from "@/lib/constants/support-issues";
import {
  buildIssueTypePrefill,
  findIssueTypeField,
  issueTypeFieldId,
} from "@/lib/utils/support-form";
import type { GravityField, GravityForm } from "@/types/form";

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
  maxLength: undefined,
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
  fields: [
    hiddenIssueField,
    {
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
    } as GravityField,
  ],
};

describe("support issues", () => {
  it("defines six support-request issue types", () => {
    expect(SUPPORT_ISSUES).toHaveLength(6);
    expect(SUPPORT_ISSUES.map((i) => i.slug)).toEqual([
      "access",
      "wrong_course",
      "duplicate_charge",
      "not_expected",
      "technical",
      "other",
    ]);
  });

  it("excludes other from cancellations issue gate", () => {
    expect(CANCELLATIONS_ISSUE_GATE).toHaveLength(5);
    expect(CANCELLATIONS_ISSUE_GATE.some((i) => i.slug === "other")).toBe(false);
  });

  it("validates issue slugs", () => {
    expect(isSupportIssueSlug("access")).toBe(true);
    expect(isSupportIssueSlug("invalid")).toBe(false);
    expect(isSupportIssueSlug(null)).toBe(false);
  });
});

describe("support form utils", () => {
  it("finds hidden issue_type field", () => {
    expect(findIssueTypeField(supportForm)?.id).toBe("1");
    expect(issueTypeFieldId(supportForm)).toBe(1);
  });

  it("builds prefill for wizard selection", () => {
    expect(buildIssueTypePrefill(supportForm, "wrong_course")).toEqual({
      input_1: "wrong_course",
    });
  });
});
