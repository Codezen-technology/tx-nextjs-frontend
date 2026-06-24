"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { StatusBadge } from "@/components/business/status-badge";
import { Button } from "@/components/ui/button";
import { useBusinessLearner } from "@/lib/hooks/useBusinessDashboard";

export default function BusinessLearnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const learnerId = Number(id);
  const { data: learner, isLoading, isError } = useBusinessLearner(learnerId);

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Learner Details"
        actions={
          <Button asChild variant="outline">
            <Link href="/business-dashboard/learners">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to learners
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl border border-neutral-30 bg-white" />
      ) : isError || !learner ? (
        <div className="rounded-xl border border-neutral-30 bg-white p-10 text-center text-sm text-red-600">
          Could not load this learner.
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-30 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3F576F]/10 text-xl font-bold text-[#3F576F]">
              {(learner.display_name || "?").charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">{learner.display_name}</h2>
              <p className="flex items-center gap-1.5 text-sm text-neutral-300">
                <Mail className="h-4 w-4" />
                {learner.email || learner.user_email || "—"}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-neutral-10 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-300">Role</dt>
              <dd className="mt-1">
                <StatusBadge status={learner.role} />
              </dd>
            </div>
            <div className="rounded-lg bg-neutral-10 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-300">
                Status
              </dt>
              <dd className="mt-1">
                <StatusBadge status={learner.status} />
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
