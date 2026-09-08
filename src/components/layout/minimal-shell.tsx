import { CourseTrustedStrip } from "../courses/course-trusted-strip";
import { SiteFloatingBar } from "./site-floating-bar";
import { MinimalHeader } from "./minimal-header";

/** Logo-only chrome for focused flows (cart, checkout). No nav, no footer. */
export function MinimalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteFloatingBar />
      <MinimalHeader />
      {/* Trust badges */}
      <CourseTrustedStrip />
      <main className="bg-neutral-10 flex-1">{children}</main>
    </div>
  );
}
