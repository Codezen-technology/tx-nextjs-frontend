"use client";

import { ChevronLeft } from "lucide-react";
import { DashboardLogo } from "@/components/dashboard/dashboard-search";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardPromoCard } from "@/components/dashboard/dashboard-promo-card";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
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
        "fixed left-0 top-0 z-30 flex h-full flex-col bg-lms-primary transition-[width] duration-300",
        open ? "w-[280px]" : "w-[65px]",
        className,
      )}
    >
      <div className="flex items-center justify-between px-2 py-4">
        {open && (
          <div className="flex flex-1 justify-center px-2">
            <DashboardLogo />
          </div>
        )}
        {open && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white hover:bg-white/10"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
      </div>
      <DashboardNav expanded={open} />
      {open && (
        <div className="mt-auto overflow-y-auto p-4">
          <DashboardPromoCard />
        </div>
      )}
    </aside>
  );
}

export function DashboardSidebar({
  open,
  onClose,
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  return (
    <>
      <SidebarPanel open={open} onClose={onClose} className="hidden md:flex" />
      <Sheet open={mobileOpen} onOpenChange={(v) => !v && onMobileClose()}>
        <SheetContent side="left" className="w-[280px] border-none bg-lms-primary p-0 text-white">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="flex justify-center py-6">
              <DashboardLogo />
            </div>
            <DashboardNav expanded onNavigate={onMobileClose} />
            <div className="mt-auto overflow-y-auto p-4">
              <DashboardPromoCard />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
