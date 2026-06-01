import { bffJson } from "@/lib/api/bff-client";
import type { AuthUser, WpUser } from "@/types/user";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export const authService = {
  async login(input: { username: string; password: string }): Promise<{ user: AuthUser }> {
    return bffJson<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async logout(): Promise<void> {
    await bffJson<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
  },

  async logoutAll(): Promise<void> {
    await bffJson<{ ok: boolean }>("/api/auth/logout-all", { method: "POST" });
  },

  async register(payload: RegisterPayload): Promise<{ user: AuthUser }> {
    return bffJson<{ user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async me(): Promise<WpUser> {
    return bffJson<WpUser>("/api/users/me", { method: "GET" });
  },

  async forgotPassword(email: string): Promise<void> {
    await bffJson<{ ok: boolean }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(input: { key: string; login: string; password: string }): Promise<void> {
    await bffJson<{ ok: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
