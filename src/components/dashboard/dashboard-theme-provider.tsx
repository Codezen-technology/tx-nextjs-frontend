"use client";

import { useEffect, type ReactNode } from "react";
import { useDashboardColors } from "@/lib/hooks/useStudentDashboard";

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const { data } = useDashboardColors();

  // The student dashboard is a light-only experience (ported 1:1 from the WP
  // plugin). The rest of the app honours the user's system/dark preference via
  // next-themes, but here we force light so the navy `neutral-900` palette and
  // shadcn dark tokens never bleed in. Restored on unmount when leaving.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");

    const forceLight = () => {
      if (root.classList.contains("dark")) root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    };

    forceLight();

    // next-themes can re-apply `dark` on a system-preference change; keep light.
    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark")) forceLight();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      root.classList.remove("light");
      root.style.colorScheme = "";
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const root = document.documentElement;
    root.style.setProperty("--color-primary", data.primary);
    root.style.setProperty("--color-secondary", data.secondary);
    root.style.setProperty("--color-background", data.background);
    root.style.setProperty("--color-text", data.text);
  }, [data]);

  return <>{children}</>;
}
