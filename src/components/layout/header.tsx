"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Search, ChevronDown, ShoppingCart, Menu, X } from "lucide-react";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCartQuery } from "@/lib/hooks/useCart";
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
        className="flex items-center gap-1 font-open-sans text-[14px] font-medium leading-[1.2] text-neutral-30 transition-colors hover:text-primary-300"
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-sm border border-neutral-600 bg-neutral-800 py-1 shadow-lg">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 font-open-sans text-[13px] text-neutral-30 transition-colors hover:bg-neutral-700 hover:text-primary-300"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (query.trim()) router.push(`/courses?search=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-3">
      <label htmlFor="header-search" className="sr-only">
        Find a course
      </label>
      <span className="font-open-sans text-[14px] font-medium text-neutral-30">Find a course:</span>
      <div className="relative">
        <input
          id="header-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. food hygiene"
          className="h-8 w-[200px] rounded-sm border border-neutral-600 bg-neutral-700 pl-3 pr-8 font-open-sans text-[14px] text-neutral-30 placeholder:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-100 hover:text-primary-300"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

function CartButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((s) => s.itemCount);
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  useCartQuery();

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
        className="flex items-center gap-1.5 font-open-sans text-[14px] font-medium text-neutral-30 transition-colors hover:text-primary-300"
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
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-5 lg:px-10">
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
            <span className="font-suse text-xl font-bold leading-tight text-neutral-30">
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
                "font-open-sans text-[14px] font-medium text-neutral-30 transition-colors hover:text-primary-300",
                pathname === "/about" && "text-primary-400",
              )}
              aria-current={pathname === "/about" ? "page" : undefined}
            >
              About us
            </Link>
            <Link
              href="/help"
              className={cn(
                "font-open-sans text-[14px] font-medium text-neutral-30 transition-colors hover:text-primary-300",
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
              className="flex items-center gap-1 font-open-sans text-[14px] font-medium text-neutral-30 transition-colors hover:text-primary-300"
            >
              Our courses
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", megaMenuOpen && "rotate-180")}
              />
            </button>
            <Link
              href="/training-teams"
              className={cn(
                "font-open-sans text-[14px] font-medium text-neutral-30 transition-colors hover:text-primary-300",
                pathname === "/training-teams" && "text-primary-400",
              )}
              aria-current={pathname === "/training-teams" ? "page" : undefined}
            >
              Training teams
            </Link>
            <NavDropdown label="Resources" links={resourcesLinks} />
            <Link
              href="/contact"
              className={cn(
                "font-open-sans text-[14px] font-medium text-neutral-30 transition-colors hover:text-primary-300",
                pathname === "/contact" && "text-primary-400",
              )}
              aria-current={pathname === "/contact" ? "page" : undefined}
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
                className="font-open-sans text-[14px] font-medium text-neutral-30 transition-colors hover:text-primary-300"
              >
                Log in
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex items-center justify-center text-neutral-30 lg:hidden"
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
              className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
            >
              About us
            </Link>
            <Link
              href="/help"
              onClick={() => setMobileOpen(false)}
              className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
            >
              Help
            </Link>
            <Link
              href="/courses"
              onClick={() => {
                setMobileOpen(false);
                closeMegaMenu();
              }}
              className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
            >
              Our courses
            </Link>
            <Link
              href="/training-teams"
              onClick={() => setMobileOpen(false)}
              className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
            >
              Training teams
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileOpen(false)}
              className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
            >
              Resources
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
            >
              Contact us
            </Link>
            <div className="my-2 border-t border-neutral-600" />
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
            >
              <ShoppingCart className="h-4 w-4" /> Basket
            </Link>
            {isAuthenticated ? (
              <ProfileNavLinks onClose={() => setMobileOpen(false)} />
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="py-2 font-open-sans text-[15px] font-medium text-neutral-30 hover:text-primary-300"
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
