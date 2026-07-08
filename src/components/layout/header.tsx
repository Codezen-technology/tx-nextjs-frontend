"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Search, ChevronDown, ShoppingCart, Menu, X } from "lucide-react";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCart } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cart.store";
import { cn } from "@/lib/utils/cn";
import { MegaMenu } from "./mega-menu";
import { MiniCart } from "@/components/cart/MiniCart";
import { ProfileMenu, ProfileNavLinks } from "./profile-menu";
import type { CourseCategory } from "@/types/course";

const resourcesLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/help", label: "Help Centre" },
  { href: "/about", label: "About Us" },
];

function NavDropdown({
  label,
  links,
}: {
  label: string;
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="font-open-sans text-neutral-30 hover:text-primary-300 flex items-center gap-1 text-[14px] leading-[1.2] font-medium transition-colors"
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-[180px] rounded-sm border border-neutral-600 bg-neutral-800 py-1 shadow-lg">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-open-sans text-neutral-30 hover:text-primary-300 block px-4 py-2 text-[13px] transition-colors hover:bg-neutral-700"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface Suggestion {
  id?: number;
  title: string;
  slug: string;
}

function CourseSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}`);
        const data = (await res.json()) as { results: Suggestion[] };
        setSuggestions(data.results ?? []);
        setOpen((data.results ?? []).length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const s = suggestions[activeIdx];
      setOpen(false);
      router.push(`/course/${s.slug}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <label htmlFor="header-search" className="sr-only">
        Find a course
      </label>
      <span className="font-open-sans text-neutral-30 text-[14px] font-medium">Find a course:</span>
      <div ref={wrapRef} className="relative">
        <input
          id="header-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="e.g. food hygiene"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-suggestions"
          className="font-open-sans text-neutral-30 focus:ring-primary-400 h-8 w-[200px] rounded-sm border border-neutral-600 bg-neutral-700 pr-8 pl-3 text-[14px] placeholder:text-neutral-100 focus:ring-1 focus:outline-hidden"
        />
        <button
          type="submit"
          aria-label="Search courses"
          className="hover:text-primary-300 absolute top-1/2 right-2 -translate-y-1/2 text-neutral-100"
        >
          {loading ? (
            <span className="border-t-primary-400 block h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-400" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>

        {open && suggestions.length > 0 && (
          <ul
            id="search-suggestions"
            role="listbox"
            className="absolute top-full left-0 z-100 mt-1 w-[320px] overflow-hidden rounded-sm border border-neutral-600 bg-white shadow-xl"
          >
            {suggestions.map((s, i) => (
              <li key={s.slug} role="option" aria-selected={i === activeIdx}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/course/${s.slug}`);
                  }}
                  className={cn(
                    "font-open-sans block w-full px-4 py-2.5 text-left text-sm text-neutral-900 transition-colors",
                    i === activeIdx ? "bg-primary-50 text-primary-600" : "hover:bg-neutral-50",
                  )}
                >
                  {s.title}
                </button>
              </li>
            ))}
            <li className="border-t border-neutral-100">
              <button
                type="submit"
                className="font-open-sans text-secondary-500 block w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-neutral-50"
              >
                See all results for &ldquo;{query}&rdquo; →
              </button>
            </li>
          </ul>
        )}
      </div>
    </form>
  );
}

function CartButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((s) => s.itemCount);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const setItemCount = useCartStore((s) => s.setItemCount);

  // Header is the single global cart-query mount: mirror the live count into the
  // persisted store so the badge shows a number instantly on the next reload.
  const { itemCount: liveCount, cart } = useCart();
  useEffect(() => {
    if (cart) setItemCount(liveCount);
  }, [cart, liveCount, setItemCount]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="font-open-sans text-neutral-30 hover:text-primary-300 flex items-center gap-1.5 text-[14px] font-medium transition-colors"
      >
        <ShoppingCart className="h-4 w-4" />
        Basket {hasHydrated ? `(${itemCount})` : "(0)"}
      </button>
      {open && <MiniCart onClose={() => setOpen(false)} />}
    </div>
  );
}

export function SiteHeader({ categories = [] }: { categories?: CourseCategory[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const pathname = usePathname();
  const settings = useSiteSettings();
  const { isAuthenticated, hasHydrated } = useAuth();
  const closeMegaMenu = useCallback(() => setMegaMenuOpen(false), []);

  useEffect(() => {
    setMegaMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const logoUrl = settings.logo_url ?? settings.logo_dark_url;

  return (
    <header className="relative w-full bg-neutral-800">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 py-5">
        {/* Logo */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="flex shrink-0 items-center gap-2"
          aria-label="Training Excellence — home"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Training Excellence"
              width={160}
              height={64}
              className="h-14 w-auto object-contain"
              priority
            />
          ) : (
            <span className="font-suse text-neutral-30 text-xl leading-tight font-bold">
              Training
              <br />
              <span className="text-primary-400">Excellence</span>
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden flex-col items-end gap-[14px] lg:flex">
          {/* Row 1: utility */}
          <div className="flex items-center gap-6">
            <Link
              href="/about"
              className={cn(
                "font-open-sans text-neutral-30 hover:text-primary-300 text-[14px] font-medium transition-colors",
                pathname === "/about" && "text-primary-400",
              )}
              aria-current={pathname === "/about" ? "page" : undefined}
            >
              About us
            </Link>
            <Link
              href="/help"
              className={cn(
                "font-open-sans text-neutral-30 hover:text-primary-300 text-[14px] font-medium transition-colors",
                pathname === "/help" && "text-primary-400",
              )}
              aria-current={pathname === "/help" ? "page" : undefined}
            >
              Help
            </Link>
            <CourseSearch />
          </div>

          {/* Row 2: main nav */}
          <div className="flex items-center gap-5">
            {/* Our courses — opens mega menu */}
            <button
              onClick={() => setMegaMenuOpen((v) => !v)}
              aria-expanded={megaMenuOpen}
              aria-haspopup="dialog"
              className="font-open-sans text-neutral-30 hover:text-primary-300 flex items-center gap-1 text-[14px] font-medium transition-colors"
            >
              Our courses
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", megaMenuOpen && "rotate-180")}
              />
            </button>
            <Link
              href="/training-teams"
              className={cn(
                "font-open-sans text-neutral-30 hover:text-primary-300 text-[14px] font-medium transition-colors",
                pathname === "/training-teams" && "text-primary-400",
              )}
              aria-current={pathname === "/training-teams" ? "page" : undefined}
            >
              Training teams
            </Link>
            <NavDropdown label="Resources" links={resourcesLinks} />
            <Link
              href="/contact-us"
              className={cn(
                "font-open-sans text-neutral-30 hover:text-primary-300 text-[14px] font-medium transition-colors",
                pathname === "/contact-us" && "text-primary-400",
              )}
              aria-current={pathname === "/contact-us" ? "page" : undefined}
            >
              Contact us
            </Link>

            {/* Vertical divider */}
            <div className="h-8 w-px bg-neutral-600" aria-hidden="true" />

            {/* Basket */}
            <CartButton />

            {/* Auth */}
            {!hasHydrated ? (
              <div className="h-5 w-16 animate-pulse rounded bg-neutral-700" />
            ) : isAuthenticated ? (
              <ProfileMenu />
            ) : (
              <Link
                href="/login"
                className="font-open-sans text-neutral-30 hover:text-primary-300 text-[14px] font-medium transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="text-neutral-30 flex items-center justify-center lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mega menu */}
      {megaMenuOpen && <MegaMenu onClose={closeMegaMenu} categories={categories} />}

      {/* Mobile nav */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-neutral-600 bg-neutral-800 px-6 pb-6 lg:hidden"
        >
          <div className="flex flex-col gap-1 pt-4">
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="font-open-sans text-neutral-30 hover:text-primary-300 py-2 text-[15px] font-medium"
            >
              About us
            </Link>
            <Link
              href="/help"
              onClick={() => setMobileOpen(false)}
              className="font-open-sans text-neutral-30 hover:text-primary-300 py-2 text-[15px] font-medium"
            >
              Help
            </Link>
            <Link
              href="/courses"
              onClick={() => {
                setMobileOpen(false);
                closeMegaMenu();
              }}
              className="font-open-sans text-neutral-30 hover:text-primary-300 py-2 text-[15px] font-medium"
            >
              Our courses
            </Link>
            <Link
              href="/training-teams"
              onClick={() => setMobileOpen(false)}
              className="font-open-sans text-neutral-30 hover:text-primary-300 py-2 text-[15px] font-medium"
            >
              Training teams
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileOpen(false)}
              className="font-open-sans text-neutral-30 hover:text-primary-300 py-2 text-[15px] font-medium"
            >
              Resources
            </Link>
            <Link
              href="/contact-us"
              onClick={() => setMobileOpen(false)}
              className="font-open-sans text-neutral-30 hover:text-primary-300 py-2 text-[15px] font-medium"
            >
              Contact us
            </Link>
            <div className="my-2 border-t border-neutral-600" />
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="font-open-sans text-neutral-30 hover:text-primary-300 flex items-center gap-1.5 py-2 text-[15px] font-medium"
            >
              <ShoppingCart className="h-4 w-4" /> Basket
            </Link>
            {isAuthenticated ? (
              <ProfileNavLinks onClose={() => setMobileOpen(false)} />
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="font-open-sans text-neutral-30 hover:text-primary-300 py-2 text-[15px] font-medium"
              >
                Log in
              </Link>
            )}
            {/* Mobile search */}
            <div className="mt-3">
              <CourseSearch />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
