import { MinimalHeader } from "@/components/layout/minimal-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50">
      <MinimalHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-16">{children}</div>
    </div>
  );
}
