import { cache } from "react";
import { coursesService } from "@/lib/services/courses";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { ImpersonationBanner } from "./impersonation-banner";
import type { CourseCategory } from "@/types/course";

const getNavCategories = cache(async (): Promise<CourseCategory[]> => {
  try {
    return await coursesService.categories();
  } catch {
    return [];
  }
});

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const categories = await getNavCategories();
  return (
    <div className="flex min-h-svh flex-col">
      <ImpersonationBanner />
      <SiteHeader categories={categories} />
      <main className="flex-1 bg-neutral-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
