"use client";

import { Suspense } from "react";
import { CertificateOrderForm } from "@/components/dashboard/certificate-order-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function CertificatePage() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="mb-6 text-2xl font-bold text-[#2e4450]">Certificate Order</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <CertificateOrderForm />
      </Suspense>
    </div>
  );
}
