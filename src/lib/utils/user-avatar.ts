import type { WpUser } from "@/types/user";

type UserLike = Pick<
  WpUser,
  "name" | "display_name" | "first_name" | "last_name" | "email" | "avatar" | "avatar_urls"
>;

/** Best display name from LMS user payload (supports WP REST + custom API shapes). */
export function getUserDisplayName(user?: UserLike | null): string {
  if (!user) return "";
  const fromParts = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return (
    user.display_name?.trim() || user.name?.trim() || fromParts || user.email?.split("@")[0] || ""
  );
}

/** Profile picture URL when set; empty when user has no custom avatar. */
export function getUserAvatarUrl(user?: UserLike | null): string | undefined {
  if (!user) return undefined;
  const custom = user.avatar?.trim();
  if (custom) return custom;
  const fromUrls = user.avatar_urls?.["96"] ?? user.avatar_urls?.["48"] ?? user.avatar_urls?.["24"];
  return fromUrls?.trim() || undefined;
}

/** Initials for avatar fallback — first letter, or first+last initial for full names. */
export function getUserInitials(user?: UserLike | null): string {
  const name = getUserDisplayName(user);
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
