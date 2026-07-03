import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IssueTypeCard } from "@/components/cancellations/issue-type-card";
import { CancellationsHero } from "@/components/cancellations/cancellations-hero";
import { SupportRequestWizard } from "@/components/cancellations/support-request-wizard";
import { SUPPORT_ISSUES } from "@/lib/constants/support-issues";
import type { GravityField, GravityForm } from "@/types/form";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/support-request",
}));

vi.mock("@/components/forms/gravity-form", () => ({
  GravityForm: () => <div data-testid="gravity-form">Gravity Form</div>,
}));

const supportForm: GravityForm = {
  id: 11,
  title: "Support Request (Headless)",
  description: "",
  button: { text: "Send" },
  hasPayment: false,
  isMultiPage: false,
  pageCount: 1,
  fields: [
    {
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
    } as GravityField,
  ],
};

beforeEach(() => {
  mockReplace.mockReset();
  mockSearchParams = new URLSearchParams();
});

describe("IssueTypeCard", () => {
  const issue = SUPPORT_ISSUES[0];

  it("renders title and description with accessible button label", () => {
    render(<IssueTypeCard issue={issue} onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: new RegExp(issue.title, "i") })).toBeInTheDocument();
    expect(screen.getByText(issue.description)).toBeInTheDocument();
  });

  it("marks selected state with aria-pressed", () => {
    render(<IssueTypeCard issue={issue} selected onClick={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("renders link mode with href", () => {
    render(<IssueTypeCard issue={issue} href="/support-request?issue=access" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/support-request?issue=access");
  });
});

describe("CancellationsHero", () => {
  it("renders eyebrow, heading emphasis, and body text", () => {
    render(
      <CancellationsHero
        eyebrow="Priority Support"
        heading="We'll sort this out"
        headingEmphasis="out"
        text="Tell us what went wrong."
      />,
    );
    expect(screen.getByText("Priority Support")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("We'll sort this out");
    expect(screen.getByText("out")).toBeInTheDocument();
    expect(screen.getByText("Tell us what went wrong.")).toBeInTheDocument();
  });
});

describe("SupportRequestWizard", () => {
  it("shows six issue cards on step 1", () => {
    render(<SupportRequestWizard form={supportForm} formId={11} supportEmail="help@example.com" />);
    expect(screen.getByText("What do you need help with?")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /can't access/i })).toHaveLength(1);
    expect(screen.getAllByRole("button")).toHaveLength(6);
  });

  it("advances to step 2 and syncs URL when an issue is selected", async () => {
    const user = userEvent.setup();
    render(<SupportRequestWizard form={supportForm} formId={11} supportEmail="help@example.com" />);

    await user.click(screen.getByRole("button", { name: /wrong course/i }));

    expect(screen.getByText("Tell us where to reply")).toBeInTheDocument();
    expect(screen.getByTestId("gravity-form")).toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/support-request?issue=wrong_course", {
      scroll: false,
    });
  });

  it("opens step 2 from ?issue= deep link with fix copy", () => {
    mockSearchParams = new URLSearchParams("issue=access");
    render(<SupportRequestWizard form={supportForm} formId={11} supportEmail="help@example.com" />);

    expect(screen.getByText("How we fix this")).toBeInTheDocument();
    expect(screen.getByText(/most access problems/i)).toBeInTheDocument();
  });

  it("returns to step 1 and clears URL when changing issue", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("issue=technical");
    render(<SupportRequestWizard form={supportForm} formId={11} supportEmail="help@example.com" />);

    await user.click(screen.getByRole("button", { name: /change issue/i }));

    expect(screen.getByText("What do you need help with?")).toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/support-request", { scroll: false });
  });

  it("shows unavailable message when form is missing", () => {
    render(<SupportRequestWizard form={null} formId={null} supportEmail="help@example.com" />);
    expect(screen.getByText(/not configured yet/i)).toBeInTheDocument();
  });
});
