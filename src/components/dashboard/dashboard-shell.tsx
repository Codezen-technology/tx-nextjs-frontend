"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { CartDrawer } from "@/components/dashboard/cart-drawer";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { useCart } from "@/lib/hooks/useCart";
import { useImpersonation } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils/cn";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const { itemCount } = useCart();
  const { active: impersonating } = useImpersonation();

  useEffect(() => {
    const handler = () => setCartOpen(true);
    window.addEventListener("open-cart-sidebar", handler);
    return () => window.removeEventListener("open-cart-sidebar", handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => {
      if (mq.matches) setSidebarOpen(false);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      className="flex min-h-screen bg-[#f8f8f8] pt-(--imp-offset)"
      style={{ "--imp-offset": impersonating ? "40px" : "0px" } as React.CSSProperties}
    >
      <ImpersonationBanner variant="fixed" />
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <DashboardHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(true)}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        cartCount={itemCount}
      />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <main
        className={cn(
          "mt-16 min-h-screen w-full min-w-0 flex-1 px-4 pb-8 md:mt-24 md:px-6 lg:px-8",
          sidebarOpen ? "md:ml-[280px]" : "md:ml-[65px]",
        )}
      >
        {children}
      </main>
    </div>
  );
}
