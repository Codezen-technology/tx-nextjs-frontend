export default function LearnRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="course-player fixed inset-0 z-50 min-h-svh overflow-hidden bg-black">
      {children}
    </div>
  );
}
