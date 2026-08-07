"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteSettings } from "@/types/settings";
import { getEnvFallbackSettings } from "@/lib/services/settings";

const SiteSettingsContext = createContext<SiteSettings>(getEnvFallbackSettings());

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}

export function useFeatureFlag(flag: keyof SiteSettings["features"]): boolean {
  const settings = useSiteSettings();
  return settings.features[flag] ?? false;
}

interface SiteSettingsProviderProps {
  settings: SiteSettings;
  children: ReactNode;
}

/**
 * Provides resolved site settings to the client component tree.
 * CSS variable injection (--primary, --accent) is handled server-side in the root layout
 * so it covers portals and avoids a flash-of-unstyled-content on hydration.
 */
export function SiteSettingsProvider({ settings, children }: SiteSettingsProviderProps) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}
