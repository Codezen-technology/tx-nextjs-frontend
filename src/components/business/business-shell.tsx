"use client";

import { useEffect, useState } from "react";
import { BusinessHeader } from "@/components/business/business-header";
import { BusinessSidebar } from "@/components/business/business-sidebar";
import { BusinessAccessGuard } from "@/components/business/business-access-guard";
import { cn } from "@/lib/utils/cn";

export function BusinessShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <BusinessSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <BusinessHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(true)}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
      />
      <main
        className={cn(
          "mt-16 min-h-screen w-full min-w-0 flex-1 px-4 pb-10 pt-6 md:px-8",
          sidebarOpen ? "md:ml-[280px]" : "md:ml-[72px]",
        )}
      >
        <BusinessAccessGuard>{children}</BusinessAccessGuard>
      </main>
    </div>
  );
}
