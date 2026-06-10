"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { CartDrawer } from "@/components/dashboard/cart-drawer";
import { useCartQuery } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cart.store";
import { cn } from "@/lib/utils/cn";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useCartQuery();
  const itemCount = useCartStore((s) => s.totals?.item_count ?? s.items.length);

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
    <div className="flex min-h-screen bg-[#f8f8f8]">
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
