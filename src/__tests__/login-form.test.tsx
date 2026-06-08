import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";

const mockMutate = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/login",
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useLogin: () => ({
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

describe("LoginForm", () => {
  it("renders username and password inputs", () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••••••")).toBeInTheDocument();
  });

  it("renders the Log in submit button", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("shows validation error when submitting empty username", async () => {
    const { container } = render(<LoginForm />);
    submitForm(container);
    await waitFor(() => {
      expect(screen.getByText(/username or email is required/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when submitting empty password", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginForm />);
    await user.type(screen.getByPlaceholderText("Email"), "test@example.com");
    submitForm(container);
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it("calls mutate with credentials on valid submit", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginForm />);
    await user.type(screen.getByPlaceholderText("Email"), "test@example.com");
    await user.type(screen.getByPlaceholderText("••••••••••••"), "secret123");
    submitForm(container);
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        username: "test@example.com",
        password: "secret123",
      });
    });
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const passwordInput = screen.getByPlaceholderText("••••••••••••");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("renders the register link", () => {
    render(<LoginForm />);
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
  });

  it("renders the forgot password link", () => {
    render(<LoginForm />);
    expect(screen.getByRole("link", { name: /forgot password/i })).toBeInTheDocument();
  });
});
