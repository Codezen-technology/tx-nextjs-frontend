"use client";

import Link from "next/link";
import { Coins, Home, LogOut, Menu, Star, User } from "lucide-react";
import { useLogout, useMe } from "@/lib/hooks/useAuth";
import { useBusinessCreditBalance, useBusinessReviewHas } from "@/lib/hooks/useBusinessDashboard";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserDisplayName } from "@/lib/utils/user-avatar";
import { cn } from "@/lib/utils/cn";

interface BusinessHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export function BusinessHeader({
  sidebarOpen,
  onToggleSidebar,
  onOpenMobileSidebar,
}: BusinessHeaderProps) {
  const { data: user } = useMe();
  const logout = useLogout();
  const { data: credit } = useBusinessCreditBalance();
  const { data: reviewStatus } = useBusinessReviewHas();
  const showReviewCta = reviewStatus && !reviewStatus.has_review;
  const displayName = getUserDisplayName(user);

  const profileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-offset-2 focus-visible:ring-2"
        >
          <UserAvatar user={user} size="md" fallbackClassName="bg-[#3F576F] font-bold text-white" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px] rounded-2xl p-0">
        <div className="flex items-center gap-3 px-5 pb-4 pt-5">
          <UserAvatar
            user={user}
            size="lg"
            className="h-11 w-11"
            fallbackClassName="bg-[#3F576F] font-bold text-white"
          />
          <div className="min-w-0">
            <p className="truncate font-bold text-neutral-900">{displayName}</p>
            {user?.email && <p className="truncate text-xs text-neutral-300">{user.email}</p>}
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <DropdownMenuItem asChild>
            <Link
              href="/business-dashboard/profile"
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
            >
              <User className="h-4 w-4 text-neutral-300" />
              Business Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/my-learning"
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
            >
              <Home className="h-4 w-4 text-neutral-300" />
              My Learning
            </Link>
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFF5F5] py-2.5 text-sm font-semibold text-[#D32F2F] hover:bg-[#FFE5E5]"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header
      className={cn(
        "fixed top-[var(--imp-offset)] z-40 flex h-16 w-full items-center border-b border-neutral-30 bg-white transition-[width,margin]",
        sidebarOpen
          ? "md:ml-[280px] md:w-[calc(100%-280px)]"
          : "md:ml-[72px] md:w-[calc(100%-72px)]",
      )}
    >
      {/* Desktop */}
      <div className="hidden w-full items-center gap-4 px-4 md:flex md:px-6">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded p-2 hover:bg-neutral-100"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6 text-neutral-700" />
          </button>
        )}
        <div className="ml-auto flex items-center gap-4">
          {showReviewCta ? (
            <Button
              asChild
              variant="outline"
              className="hidden border-[#F9A31A] text-[#B9760A] hover:bg-[#F9A31A]/10 sm:inline-flex"
            >
              <Link href="/business-dashboard/reviews">
                <Star className="mr-2 h-4 w-4" />
                Leave feedback
              </Link>
            </Button>
          ) : null}
          {credit ? (
            <div className="flex items-center gap-2 rounded-full bg-[#F9A31A]/15 px-4 py-1.5 text-sm font-semibold text-[#B9760A]">
              <Coins className="h-4 w-4" />
              {credit.balance} credits
            </div>
          ) : null}
          <Button
            asChild
            variant="ghost"
            className="rounded-full bg-neutral-20 px-5 text-sm font-semibold text-[#3F576F] hover:bg-neutral-30"
          >
            <Link href="/" target="_blank">
              <Home className="mr-2 h-4 w-4" />
              Go to website
            </Link>
          </Button>
          <div className="h-8 w-px bg-neutral-30" />
          {profileMenu}
        </div>
      </div>

      {/* Mobile */}
      <div className="flex w-full items-center justify-between px-4 md:hidden">
        <button type="button" onClick={onOpenMobileSidebar} aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
        <span className="text-sm font-bold text-[#3F576F]">Business</span>
        {profileMenu}
      </div>
    </header>
  );
}
