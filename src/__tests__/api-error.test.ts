import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import { ApiError, toApiError } from "@/lib/api/error";

describe("ApiError", () => {
  it("constructs with status, code, message", () => {
    const err = new ApiError({ status: 401, code: "lms_auth_failed", message: "Unauthorized" });
    expect(err.status).toBe(401);
    expect(err.code).toBe("lms_auth_failed");
    expect(err.message).toBe("Unauthorized");
  });

  it("sets name to ApiError", () => {
    const err = new ApiError({ status: 0, code: "unknown", message: "Oops" });
    expect(err.name).toBe("ApiError");
  });

  it("stores raw payload when provided", () => {
    const raw = { foo: "bar" };
    const err = new ApiError({ status: 500, code: "server_error", message: "Fail", raw });
    expect(err.raw).toBe(raw);
  });

  it("passes instanceof check", () => {
    const err = new ApiError({ status: 0, code: "x", message: "y" });
    expect(err instanceof ApiError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

describe("toApiError", () => {
  it("returns an ApiError unchanged", () => {
    const err = new ApiError({ status: 404, code: "not_found", message: "Not found" });
    expect(toApiError(err)).toBe(err);
  });

  it("converts a plain Error to ApiError with status 0", () => {
    const err = toApiError(new Error("Something broke"));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.code).toBe("unknown_error");
    expect(err.message).toBe("Something broke");
  });

  it("converts an AxiosError with response to ApiError", () => {
    const axiosErr = new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 422,
      data: { code: "lms_validation_error", message: "Invalid input" },
      headers: {},
      config: {} as never,
      statusText: "Unprocessable Entity",
    });
    const apiErr = toApiError(axiosErr);
    expect(apiErr.status).toBe(422);
    expect(apiErr.code).toBe("lms_validation_error");
    expect(apiErr.message).toBe("Invalid input");
  });

  it("converts an AxiosError without response to status 0", () => {
    const axiosErr = new AxiosError("Network Error", "ERR_NETWORK");
    const apiErr = toApiError(axiosErr);
    expect(apiErr.status).toBe(0);
    expect(apiErr.message).toBe("Network Error");
  });

  it("converts unknown values to ApiError with generic message", () => {
    const apiErr = toApiError("something weird");
    expect(apiErr).toBeInstanceOf(ApiError);
    expect(apiErr.status).toBe(0);
    expect(apiErr.message).toBe("An unexpected error occurred");
  });
});
