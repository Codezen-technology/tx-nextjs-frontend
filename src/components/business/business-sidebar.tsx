"use client";

import Link from "next/link";
import { Building2, ChevronLeft } from "lucide-react";
import { BusinessNav } from "@/components/business/business-nav";
import { useBusinessProfile } from "@/lib/hooks/useBusinessDashboard";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";

function BusinessBrand({ expanded }: { expanded: boolean }) {
  const { data: business } = useBusinessProfile();
  const name = business?.company_name?.trim();

  return (
    <Link href="/business-dashboard" className="flex min-w-0 items-center gap-2">
      {business?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={business.logo_url}
          alt={name ?? "Business"}
          className="h-9 w-9 shrink-0 rounded-md bg-white object-contain p-0.5"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/15 text-white">
          <Building2 className="h-5 w-5" />
        </span>
      )}
      {expanded && (
        <span className="truncate text-base font-bold text-white">{name || "Business"}</span>
      )}
    </Link>
  );
}

function SidebarPanel({
  open,
  onClose,
  className,
}: {
  open: boolean;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-full flex-col bg-[#3F576F] transition-[width] duration-300",
        open ? "w-[280px]" : "w-[72px]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-4">
        {open ? (
          <BusinessBrand expanded />
        ) : (
          <div className="mx-auto">
            <BusinessBrand expanded={false} />
          </div>
        )}
        {open && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white hover:bg-white/10"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>
      <BusinessNav expanded={open} />
    </aside>
  );
}

interface BusinessSidebarProps {
  open: boolean;
  onClose: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function BusinessSidebar({
  open,
  onClose,
  mobileOpen,
  onMobileClose,
}: BusinessSidebarProps) {
  return (
    <>
      <SidebarPanel open={open} onClose={onClose} className="hidden md:flex" />
      <Sheet open={mobileOpen} onOpenChange={(v) => !v && onMobileClose()}>
        <SheetContent side="left" className="w-[280px] border-none bg-[#3F576F] p-0 text-white">
          <SheetTitle className="sr-only">Business navigation</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="px-4 py-5">
              <BusinessBrand expanded />
            </div>
            <BusinessNav expanded onNavigate={onMobileClose} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
