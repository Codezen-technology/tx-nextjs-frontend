/**
 * Server-only fetcher for Gravity Forms schemas via lms-backend/v1/forms/{id}.
 * Use in RSC to render forms with SSR; submission stays client-side
 * (see `formsService` in forms.ts).
 */
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { GravityForm } from "@/types/form";

export async function fetchForm(id: number | string): Promise<GravityForm | null> {
  try {
    return await serverFetch<GravityForm>(endpoints.forms.detail(id), {
      revalidate: 3600,
      tags: [`form:${id}`],
    });
  } catch {
    return null;
  }
}
