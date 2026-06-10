import { bffJson } from "@/lib/api/bff-client";
import type { WpUser } from "@/types/user";

interface UpdateMePayload {
  first_name?: string;
  last_name?: string;
  name?: string;
  description?: string;
  url?: string;
  email?: string;
  password?: string;
}

export const userService = {
  async me(): Promise<WpUser> {
    return bffJson<WpUser>("/api/users/me", { method: "GET" });
  },

  async updateMe(payload: UpdateMePayload): Promise<WpUser> {
    return bffJson<WpUser>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await fetch("/api/users/me/avatar", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = (await res.json()) as { avatar?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Avatar upload failed");
    return { avatar: data.avatar ?? "" };
  },
};
