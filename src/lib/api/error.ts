import { AxiosError } from "axios";
import type { ApiErrorShape, WpError } from "@/types/api";

export class ApiError extends Error {
  status: number;
  code: string;
  raw?: unknown;

  constructor({ status, code, message, raw }: ApiErrorShape & { raw?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.raw = raw;
  }
}

/**
 * WP leaks PHP fatals / "critical error" HTML pages and raw notices into REST
 * `message` fields when `display_errors` is on. Never surface those to end users —
 * they expose server paths/internals and render as broken markup. Detect the
 * fatal-page signatures and replace with a clean, generic message. Legitimate WP
 * auth errors (e.g. "<strong>Error:</strong> Incorrect password") are short and
 * pass through unchanged so the client can parse their inline HTML.
 */
export function sanitizeWpErrorMessage(
  message: string | undefined | null,
  fallback = "Something went wrong on our end. Please try again.",
): string {
  if (!message || !message.trim()) return fallback;
  const fatal =
    /there has been a critical error|<!doctype|<\s*br\b|<\s*html\b|wordpress\.org\/documentation\/article\/faq-troubleshooting|fatal error|stack trace|on line \d+ in/i;
  return fatal.test(message) ? fallback : message;
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof AxiosError) {
    const status = err.response?.status ?? 0;
    const data = err.response?.data as Partial<WpError> | undefined;
    const code = data?.code ?? err.code ?? "request_failed";
    const message = data?.message ?? err.message ?? "Something went wrong";
    return new ApiError({ status, code, message, raw: err.response?.data });
  }

  if (err instanceof Error) {
    return new ApiError({ status: 0, code: "unknown_error", message: err.message, raw: err });
  }

  return new ApiError({
    status: 0,
    code: "unknown_error",
    message: "An unexpected error occurred",
    raw: err,
  });
}
