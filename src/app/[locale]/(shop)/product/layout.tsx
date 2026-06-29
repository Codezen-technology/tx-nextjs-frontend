import { SiteShell } from "@/components/layout/site-shell";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
