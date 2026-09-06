"use client";

import { OnboardingWizard } from "@/components/business/onboarding-wizard";
import { useBusinessSettings } from "@/lib/hooks/useBusinessDashboard";

/**
 * Shows the setup wizard instead of the dashboard until onboarding completes.
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
    return <OnboardingWizard settings={settings} />;
  }

  return <>{children}</>;
}
