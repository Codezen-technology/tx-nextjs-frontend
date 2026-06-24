"use client";

import { useEffect, type ReactNode } from "react";

/**
 * The business dashboard is a light-only experience that mirrors the
 * wplms-business-dashboard plugin (slate-blue + amber). Force light mode so the
 * app's dark tokens never bleed into cards/tables. Restored on unmount.
 */
export function BusinessThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");

    const forceLight = () => {
      if (root.classList.contains("dark")) root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    };

    forceLight();

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

  return <>{children}</>;
}
