import { CourseTrustedStrip } from "../courses/course-trusted-strip";
import { MinimalHeader } from "./minimal-header";

/** Logo-only chrome for focused flows (cart, checkout). No nav, no footer. */
export function MinimalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <MinimalHeader />
      {/* Trust badges */}
      <CourseTrustedStrip />
      <main className="flex-1 bg-neutral-10">{children}</main>
    </div>
  );
}
