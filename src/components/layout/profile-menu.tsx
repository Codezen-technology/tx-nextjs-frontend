"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  BookOpen,
  Award,
  Gift,
  RefreshCw,
  Clock,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  Briefcase,
} from "lucide-react";
import { useAuth, useLogout, useMe } from "@/lib/hooks/useAuth";
import { useB2BPluginActive } from "@/lib/hooks/useBusinessDashboard";
import { hasBusinessAccess } from "@/components/business/business-access-guard";
import { cn } from "@/lib/utils/cn";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function Avatar({
  src,
  initials,
  size = "sm",
}: {
  src?: string;
  initials: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "h-10 w-10 text-[15px]" : "h-6 w-6 text-[11px]";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={cn("shrink-0 rounded-full object-cover", dim)} />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-400 font-bold text-white",
        dim,
      )}
    >
      {initials}
    </span>
  );
}

const STUDENT_LINKS = [
  { href: "/dashboard/my-learning", label: "My Learning", Icon: BookOpen },
  { href: "/dashboard/all-courses", label: "All Courses", Icon: BookOpen },
  { href: "/dashboard/my-learning?tab=certificates", label: "Certificates", Icon: Award },
  { href: "/special-offers", label: "Special Offers", Icon: Gift },
];

const ACCOUNT_LINKS = [
  { href: "/dashboard/subscription", label: "Subscriptions", Icon: RefreshCw },
  { href: "/dashboard/my-orders", label: "Purchase History", Icon: Clock },
];

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();
  const logout = useLogout();
  const { data: wpUser } = useMe();

  const isBusinessUser = hasBusinessAccess(wpUser?.roles);
  const b2bPluginActive = useB2BPluginActive();
  const showBusinessDashboard = isBusinessUser && b2bPluginActive;
  const initials = user ? getInitials(user.displayName) : "?";
  const avatarSrc =
    wpUser?.avatar_urls?.["48"] ?? wpUser?.avatar_urls?.["96"] ?? wpUser?.avatar_urls?.["24"];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!isAuthenticated || !user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 font-open-sans text-[14px] font-medium text-neutral-30 transition-colors hover:text-primary-300"
      >
        <Avatar src={avatarSrc} initials={initials} size="sm" />
        {user.displayName}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border border-neutral-200 bg-white py-2 shadow-xl"
        >
          {/* Identity header */}
          <div className="flex items-center gap-3 px-4 pb-3 pt-2">
            <Avatar src={avatarSrc} initials={initials} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-open-sans text-[14px] font-semibold text-neutral-900">
                {user.displayName}
              </p>
              <Link
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="font-open-sans text-[12px] text-primary-400 hover:underline"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          <div className="border-t border-neutral-100" />

          {/* Dashboard CTAs */}
          <div className="flex flex-col gap-2 px-3 py-3">
            <Link
              href="/dashboard/my-learning"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center justify-center gap-2 rounded border border-neutral-300 px-3 py-2 font-open-sans text-[13px] font-medium text-neutral-800 transition-colors hover:border-primary-400 hover:text-primary-400"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Go to My Dashboard
            </Link>
            {showBusinessDashboard && (
              <Link
                href="/business-dashboard"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center justify-center gap-2 rounded border border-neutral-300 px-3 py-2 font-open-sans text-[13px] font-medium text-neutral-800 transition-colors hover:border-primary-400 hover:text-primary-400"
              >
                <Briefcase className="h-4 w-4 shrink-0" />
                Go to Business Dashboard
              </Link>
            )}
          </div>

          <div className="border-t border-neutral-100" />

          {/* Student links */}
          <div className="py-1">
            {STUDENT_LINKS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2 font-open-sans text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-primary-400"
              >
                <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-neutral-100" />

          {/* Account links */}
          <div className="py-1">
            {ACCOUNT_LINKS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2 font-open-sans text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-primary-400"
              >
                <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-neutral-100" />

          {/* Footer */}
          <div className="py-1">
            <Link
              href="/help"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2 font-open-sans text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-primary-400"
            >
              <HelpCircle className="h-4 w-4 shrink-0 text-neutral-400" />
              Help & Support
            </Link>
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2 font-open-sans text-[13px] text-red-500 transition-colors hover:bg-neutral-50"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Flat list of profile nav links for mobile drawer — no dropdown */
export function ProfileNavLinks({ onClose }: { onClose: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const logout = useLogout();
  const { data: wpUser } = useMe();
  const isBusinessUser = hasBusinessAccess(wpUser?.roles);
  const b2bPluginActive = useB2BPluginActive();
  const showBusinessDashboard = isBusinessUser && b2bPluginActive;

  if (!isAuthenticated || !user) return null;

  return (
    <>
      <Link
        href="/dashboard/my-learning"
        onClick={onClose}
        className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
      >
        My Dashboard
      </Link>
      {showBusinessDashboard && (
        <Link
          href="/business-dashboard"
          onClick={onClose}
          className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
        >
          Business Dashboard
        </Link>
      )}
      <Link
        href="/dashboard/my-learning"
        onClick={onClose}
        className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
      >
        My Courses
      </Link>
      <Link
        href="/dashboard/my-learning?tab=certificates"
        onClick={onClose}
        className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
      >
        Certificates
      </Link>
      <Link
        href="/dashboard/my-orders"
        onClick={onClose}
        className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
      >
        Purchase History
      </Link>
      <Link
        href="/dashboard/profile"
        onClick={onClose}
        className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
      >
        Edit Profile
      </Link>
      <button
        onClick={() => {
          logout();
          onClose();
        }}
        className="py-2 text-left font-open-sans text-[15px] font-medium text-red-400 hover:text-red-300"
      >
        Log out
      </button>
    </>
  );
}
