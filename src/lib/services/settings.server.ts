import "server-only";
import { serverApi } from "@/lib/api/server";
import { mergeSettings, getEnvFallbackSettings } from "./settings";
import type { SiteSettings, ApiSiteSettings } from "@/types/settings";

/**
 * Fetch site settings from the WP backend.
 * Only call from Server Components or `generateMetadata`.
 * Falls back silently to env-var defaults if the endpoint isn't available yet.
 */
export async function fetchSettings(): Promise<SiteSettings> {
  try {
    const data = (await serverApi.settings.get()) as ApiSiteSettings;
    return mergeSettings(data ?? {});
  } catch {
    return getEnvFallbackSettings();
  }
}
