"use client";

import { Building2, Coins, CalendarDays } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { KpiCard } from "@/components/business/kpi-card";
import { StatusBadge } from "@/components/business/status-badge";
import { useBusinessCreditBalance, useBusinessProfile } from "@/lib/hooks/useBusinessDashboard";

const INDUSTRY_LABELS: Record<string, string> = {
  technology: "Technology",
  healthcare: "Healthcare",
  education: "Education",
  finance: "Finance",
  manufacturing: "Manufacturing",
  retail: "Retail",
  services: "Services",
  other: "Other",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

function ProfileField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg bg-neutral-10 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-300">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-neutral-900">{value || "—"}</dd>
    </div>
  );
}

export default function BusinessProfilePage() {
  const { data: business, isLoading, isError } = useBusinessProfile();
  const { data: credit } = useBusinessCreditBalance();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BusinessPageHeader title="Business Profile" />
        <div className="h-64 animate-pulse rounded-xl border border-neutral-30 bg-white" />
      </div>
    );
  }

  if (isError || !business) {
    return (
      <div className="space-y-6">
        <BusinessPageHeader title="Business Profile" />
        <div className="rounded-xl border border-neutral-30 bg-white p-10 text-center text-sm text-red-600">
          Could not load business profile.
        </div>
      </div>
    );
  }

  const creditBalance = credit?.balance ?? business.credit_balance ?? 0;
  const industry = INDUSTRY_LABELS[business.industry?.toLowerCase()] ?? business.industry ?? "—";

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Profile"
        description="Your company information and account status."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Current Status" value={business.status} icon={Building2} tone="primary" />
        <KpiCard label="Credit Balance" value={creditBalance} icon={Coins} tone="amber" />
        <KpiCard
          label="Member Since"
          value={formatDate(business.created_at)}
          icon={CalendarDays}
          tone="success"
        />
      </div>

      <div className="rounded-xl border border-neutral-30 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {business.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logo_url}
              alt={business.company_name}
              className="h-20 w-20 rounded-lg border border-neutral-30 object-contain p-1"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-[#3F576F]/10 text-2xl font-bold text-[#3F576F]">
              {(business.company_name || "B").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-neutral-900">{business.company_name}</h2>
            <div className="mt-2">
              <StatusBadge status={business.status} />
            </div>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileField label="Company Name" value={business.company_name} />
          <ProfileField label="Business Email" value={business.business_email} />
          <ProfileField label="Phone" value={business.phone} />
          <ProfileField label="Tax ID" value={business.tax_id} />
          <ProfileField label="Industry" value={industry} />
          <ProfileField label="Company Size" value={business.company_size} />
          <ProfileField label="Address" value={business.address} />
          {business.system_type ? (
            <ProfileField
              label="Billing System"
              value={business.system_type === "credits" ? "Credits" : "Subscription"}
            />
          ) : null}
        </dl>
      </div>
    </div>
  );
}
