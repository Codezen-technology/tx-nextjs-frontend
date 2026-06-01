export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4 py-16">
      {children}
    </div>
  );
}
