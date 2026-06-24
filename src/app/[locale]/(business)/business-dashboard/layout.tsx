import { BusinessThemeProvider } from "@/components/business/business-theme-provider";
import { BusinessShell } from "@/components/business/business-shell";

export default function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessThemeProvider>
      <BusinessShell>{children}</BusinessShell>
    </BusinessThemeProvider>
  );
}
