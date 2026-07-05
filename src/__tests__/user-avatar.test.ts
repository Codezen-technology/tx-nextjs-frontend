import { describe, expect, it } from "vitest";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/utils/user-avatar";

describe("getUserDisplayName", () => {
  it("prefers display_name", () => {
    expect(getUserDisplayName({ display_name: "John Doe", email: "j@x.com" })).toBe("John Doe");
  });

  it("falls back to first + last name", () => {
    expect(getUserDisplayName({ first_name: "Osman", last_name: "Goni", email: "o@x.com" })).toBe(
      "Osman Goni",
    );
  });

  it("falls back to email local part", () => {
    expect(getUserDisplayName({ email: "osmansufy20@gmail.com" })).toBe("osmansufy20");
  });
});

describe("getUserAvatarUrl", () => {
  it("returns custom avatar URL", () => {
    expect(getUserAvatarUrl({ avatar: "https://cdn.example.com/p.jpg" })).toBe(
      "https://cdn.example.com/p.jpg",
    );
  });

  it("falls back to avatar_urls", () => {
    expect(getUserAvatarUrl({ avatar_urls: { "96": "https://gravatar.com/a.jpg" } })).toBe(
      "https://gravatar.com/a.jpg",
    );
  });

  it("returns undefined when no avatar", () => {
    expect(getUserAvatarUrl({ email: "a@b.com" })).toBeUndefined();
  });
});

describe("getUserInitials", () => {
  it("returns single initial for one word", () => {
    expect(getUserInitials({ display_name: "Osman" })).toBe("O");
  });

  it("returns two initials for full name", () => {
    expect(getUserInitials({ display_name: "Osman Goni" })).toBe("OG");
  });

  it("derives from email when no name", () => {
    expect(getUserInitials({ email: "osmansufy20@gmail.com" })).toBe("O");
  });
});
