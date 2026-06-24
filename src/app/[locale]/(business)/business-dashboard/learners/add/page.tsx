"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddBusinessLearner } from "@/lib/hooks/useBusinessDashboard";
import { businessDashboardService } from "@/lib/services/business-dashboard";

export default function AddBusinessLearnerPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [emailError, setEmailError] = useState("");
  const addLearner = useAddBusinessLearner();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    try {
      const check = await businessDashboardService.checkLearnerEmail(email.trim());
      if (!check.available) {
        setEmailError(check.message ?? "Email is not available");
        return;
      }
      await addLearner.mutateAsync({
        email: email.trim(),
        display_name: displayName.trim() || undefined,
      });
      window.location.href = "/business-dashboard/learners";
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Could not add learner");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BusinessPageHeader
        title="Add Learner"
        actions={
          <Button asChild variant="outline">
            <Link href="/business-dashboard/learners">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-neutral-30 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="text-sm font-medium text-neutral-700">Email</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">Display name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1"
          />
        </div>
        {emailError ? <p className="text-sm text-red-600">{emailError}</p> : null}
        <Button
          type="submit"
          className="w-full bg-[#3F576F] hover:bg-[#33485d]"
          disabled={addLearner.isPending}
        >
          {addLearner.isPending ? "Adding…" : "Add learner"}
        </Button>
      </form>
    </div>
  );
}
