"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function DashboardSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/dashboard/all-courses?search=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSearch} className={cn("relative w-full max-w-xl", className)}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search courses..."
        className="border-lms-primary h-12 rounded-full pr-24 pl-4"
      />
      <Button
        type="submit"
        size="sm"
        className="hover:bg-lms-primary/90 bg-lms-primary absolute top-1/2 right-1 h-9 -translate-y-1/2 rounded-full px-4"
      >
        <Search className="h-4 w-4 lg:mr-1" />
        <span className="hidden lg:inline">Search</span>
      </Button>
    </form>
  );
}

export function CartIconButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-full p-2 transition hover:bg-neutral-100"
      aria-label="Open cart"
    >
      <ShoppingCart className="text-lms-text h-6 w-6" />
      {count > 0 && (
        <span className="bg-lms-secondary absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Dashboard brand mark, sourced from WordPress (`GET /settings` → branding).
 *
 * `onDark` picks which of the backend's two slots to use. They are named by the
 * background they belong on — WP admin → Branding offers "Logo" and "Logo for
 * dark backgrounds" — precisely because "light/dark logo" reads both ways and
 * has been filled backwards before. So the caller states its own background and
 * the component picks; it cannot infer that from a Tailwind class.
 *
 * Defaults to `true`: the sidebar panel is the primary use and sits on the navy
 * brand colour. The white mobile toolbar must pass `onDark={false}`.
 */
export function DashboardLogo({
  className,
  onDark = true,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const settings = useSiteSettings();
  const [failed, setFailed] = useState(false);

  // Prefer the slot matching this background, then the other one. The
  // cross-slot step is deliberate: a site that filled only one slot is better
  // served its own logo at imperfect contrast than no mark at all, and most
  // logos carry enough colour to read either way.
  const src = onDark
    ? settings.logo_dark_url || settings.logo_url
    : settings.logo_url || settings.logo_dark_url;

  return (
    <Link
      href="/dashboard/my-learning"
      className={cn("flex h-12 items-center", className)}
      aria-label={`${settings.site_name} — dashboard home`}
    >
      {src && !failed ? (
        <Image
          // Remount on src change so switching slots re-arms onError rather
          // than keeping a stale failed state.
          key={src}
          src={src}
          alt={settings.site_name}
          width={160}
          height={48}
          className="h-12 w-auto object-contain"
          // No bundled artwork stands in — shipping one brand's logo as every
          // site's fallback is exactly the trap ADR-0008 calls out. A broken or
          // unset URL degrades to the site's own name instead.
          onError={() => setFailed(true)}
          priority
        />
      ) : (
        <span
          className={cn(
            "truncate text-lg leading-tight font-bold",
            onDark ? "text-white" : "text-lms-text",
          )}
        >
          {settings.site_name}
        </span>
      )}
    </Link>
  );
}
