"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
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
        className="h-12 rounded-full border-lms-primary pl-4 pr-24"
      />
      <Button
        type="submit"
        size="sm"
        className="hover:bg-lms-primary/90 absolute right-1 top-1/2 h-9 -translate-y-1/2 rounded-full bg-lms-primary px-4"
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
      <ShoppingCart className="h-6 w-6 text-lms-text" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-lms-secondary px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

export function DashboardLogo({ className }: { className?: string }) {
  return (
    <Link href="/dashboard/my-learning" className={cn("flex items-center", className)}>
      <Image
        src="/dashboard/dashboard-white-logo.svg"
        alt="Dashboard"
        width={160}
        height={48}
        className="h-12 w-auto object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </Link>
  );
}
