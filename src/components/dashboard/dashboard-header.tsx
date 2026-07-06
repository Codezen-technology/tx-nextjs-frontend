"use client";

import Link from "next/link";
import { HelpCircle, History, Home, Loader2, Lock, LogOut, Menu, Award } from "lucide-react";
import { useLogout, useMe } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  CartIconButton,
  DashboardLogo,
  DashboardSearch,
} from "@/components/dashboard/dashboard-search";
import { getUserDisplayName } from "@/lib/utils/user-avatar";
import { cn } from "@/lib/utils/cn";

interface DashboardHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  onOpenCart: () => void;
  cartCount: number;
}

export function DashboardHeader({
  sidebarOpen,
  onToggleSidebar,
  onOpenMobileSidebar,
  onOpenCart,
  cartCount,
}: DashboardHeaderProps) {
  const { data: user } = useMe();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const displayName = getUserDisplayName(user);

  const profileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-offset-2 focus-visible:ring-2"
        >
          <UserAvatar user={user} size="md" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px] rounded-3xl p-0">
        <div className="flex items-center gap-3 px-6 pb-4 pt-6">
          <UserAvatar user={user} size="lg" />
          <div className="min-w-0">
            {displayName ? (
              <p className="truncate font-bold text-[#213039]">{displayName}</p>
            ) : null}
            {user?.email && <p className="truncate text-xs text-[#586973]">{user.email}</p>}
            <Link href="/dashboard/profile" className="text-sm text-lms-secondary hover:underline">
              Edit Profile
            </Link>
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          {[
            { label: "Subscriptions", href: "/dashboard/subscription", icon: Award },
            { label: "Order History", href: "/dashboard/my-orders", icon: History },
            { label: "Change Password", href: "/forgot-password", icon: Lock },
          ].map(({ label, href, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild>
              <Link
                href={href}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
              >
                <Icon className="h-4 w-4 text-[#586973]" />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <DropdownMenuItem className="flex items-center gap-3 rounded-lg px-3 py-2">
            <HelpCircle className="h-4 w-4 text-[#586973]" />
            Help &amp; Support
          </DropdownMenuItem>
          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="mx-2 mb-2 flex w-[calc(100%-1rem)] items-center justify-center gap-2 rounded-lg bg-[#FFF5F5] py-2.5 text-sm font-semibold text-[#D32F2F] hover:bg-[#FFE5E5] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {isLoggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header
      className={cn(
        "fixed top-[var(--imp-offset)] z-40 flex h-16 w-full items-center bg-white shadow-sm transition-[width,margin] md:h-24 md:shadow-none",
        sidebarOpen
          ? "md:ml-[280px] md:w-[calc(100%-280px)]"
          : "md:ml-[65px] md:w-[calc(100%-65px)]",
      )}
    >
      {/* Desktop toolbar */}
      <div className="hidden w-full items-center gap-4 px-4 md:flex md:px-6">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded p-2 hover:bg-neutral-100"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6 text-lms-text" />
          </button>
        )}
        <DashboardSearch />
        <div className="ml-auto flex items-center gap-4">
          <Button
            asChild
            variant="ghost"
            className="rounded-full bg-[#F6F6FA] px-6 text-base font-semibold capitalize text-lms-primary hover:bg-[#F6F6FA]/80"
          >
            <Link href="/" target="_blank">
              <Home className="mr-2 h-5 w-5" />
              Go to website
            </Link>
          </Button>
          <div className="h-10 w-0.5 bg-[#EAECEE]" />
          <CartIconButton count={cartCount} onClick={onOpenCart} />
          {profileMenu}
        </div>
      </div>

      {/* Mobile toolbar */}
      <div className="flex w-full items-center justify-between px-4 md:hidden">
        <button type="button" onClick={onOpenMobileSidebar} aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
        <DashboardLogo />
        {profileMenu}
      </div>
    </header>
  );
}
