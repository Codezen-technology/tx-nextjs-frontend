"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/utils/user-avatar";
import type { WpUser } from "@/types/user";

type UserAvatarUser = Pick<
  WpUser,
  "name" | "display_name" | "first_name" | "last_name" | "email" | "avatar" | "avatar_urls"
>;

const SIZE_CLASS = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-xl",
} as const;

interface UserAvatarProps {
  user?: UserAvatarUser | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ user, size = "md", className, fallbackClassName }: UserAvatarProps) {
  const src = getUserAvatarUrl(user);
  const initials = getUserInitials(user);
  const alt = getUserDisplayName(user);

  return (
    <Avatar className={cn(SIZE_CLASS[size], className)}>
      {src ? <AvatarImage src={src} alt={alt} /> : null}
      <AvatarFallback
        className={cn("bg-lms-secondary font-bold text-white", SIZE_CLASS[size], fallbackClassName)}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
