/**
 * Server component: fetches a Gravity Form schema (SSR, cached) and hands it to
 * the client `<GravityForm>` renderer. Drop-in for any RSC:
 *
 *   <GravityFormLoader formId={3} />
 *
 * Returns the fallback (or null) when the form is missing / Gravity Forms is
 * inactive, so pages degrade gracefully.
 */
import { fetchForm } from "@/lib/services/forms.server";
import { GravityForm } from "./gravity-form";

interface GravityFormLoaderProps {
  formId: number | string;
  className?: string;
  fallback?: React.ReactNode;
}

export async function GravityFormLoader({
  formId,
  className,
  fallback = null,
}: GravityFormLoaderProps) {
  const form = await fetchForm(formId);

  if (!form) return <>{fallback}</>;

  return <GravityForm form={form} className={className} />;
}
