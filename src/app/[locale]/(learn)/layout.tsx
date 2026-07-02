import { ImpersonationBanner } from "@/components/layout/impersonation-banner";

export default function LearnRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="course-player fixed inset-0 z-50 flex h-svh flex-col overflow-hidden bg-black">
      <ImpersonationBanner />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
