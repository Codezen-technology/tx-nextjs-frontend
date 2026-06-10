"use client";

import { AlertCircle } from "lucide-react";

export function DashboardErrorBanner({ message }: { message?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message ?? "Unable to load. Please try again."}
    </div>
  );
}
