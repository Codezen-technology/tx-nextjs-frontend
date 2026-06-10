import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/components/auth/register-form";

const mockMutate = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/register",
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useRegister: () => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

beforeEach(() => {
  mockMutate.mockReset();
});

function submitForm(container: HTMLElement) {
  const form = container.querySelector("form")!;
  fireEvent.submit(form);
}

describe("RegisterForm", () => {
  it("renders all input fields with labels", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("renders the Register submit button", () => {
    render(<RegisterForm />);
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  it("shows validation error when submitting empty name", async () => {
    const { container } = render(<RegisterForm />);
    submitForm(container);
    await waitFor(() => {
      expect(screen.getByText(/enter your name/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "not-an-email");
    submitForm(container);
    await waitFor(() => {
      expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when password too short", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    submitForm(container);
    await waitFor(() => {
      expect(screen.getByText(/min 8 characters/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when terms not accepted", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    submitForm(container);
    await waitFor(() => {
      expect(screen.getByText(/you must accept the terms/i)).toBeInTheDocument();
    });
  });

  it("calls mutate with credentials on valid submit", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("checkbox"));
    submitForm(container);
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        terms: true,
      });
    });
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("renders the login link", () => {
    render(<RegisterForm />);
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  });

  it("renders the terms link", () => {
    render(<RegisterForm />);
    expect(screen.getByRole("link", { name: /terms/i })).toBeInTheDocument();
  });
});
