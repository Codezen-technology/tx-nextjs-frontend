"use client";

import { OnboardingWizard } from "@/components/business/onboarding-wizard";
import { useBusinessSettings } from "@/lib/hooks/useBusinessDashboard";

/**
 * Shows the setup wizard instead of the dashboard until onboarding completes.
 *
 * The wizard covers the whole viewport, sidebar and header included, rather
 * than sitting in the content column. The gate wraps every business route, so
 * a visible nav during setup is a nav where all ten destinations render this
 * same screen — the URL changes, the sidebar highlight moves, and nothing else
 * does. Better to offer no destinations than ten false ones.
 *
 * It renders as a fixed layer rather than by hoisting this component above the
 * shell, which would put it ahead of BusinessAccessGuard and fire the settings
 * fetch for people who should not reach the dashboard at all.
 *
 * Fails open: if the settings call errors, the dashboard renders. A backend
 * hiccup should not lock a manager out of a working dashboard, and the wizard
 * writes nothing until its final step anyway.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { data: settings, isLoading, isError } = useBusinessSettings();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-100 border-t-[#3F576F]" />
      </div>
    );
  }

  if (!isError && settings && !settings.onboarding_complete) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <OnboardingWizard settings={settings} />
      </div>
    );
  }

  return <>{children}</>;
}
