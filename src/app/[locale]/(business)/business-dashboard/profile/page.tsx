"use client";

import { useState } from "react";
import { Building2, CalendarDays, KeyRound, Pencil } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { KpiCard } from "@/components/business/kpi-card";
import { StatusBadge } from "@/components/business/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useBusinessLicenceBalance,
  useBusinessProfile,
  useUpdateBusinessProfile,
} from "@/lib/hooks/useBusinessDashboard";
import { sumAvailableLicences } from "@/lib/utils/business-licences";

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
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function ProfileField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="bg-neutral-10 rounded-lg p-4">
      <dt className="text-xs font-medium tracking-wide text-neutral-300 uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-neutral-900">{value || "—"}</dd>
    </div>
  );
}

export default function BusinessProfilePage() {
  const { data: business, isLoading, isError } = useBusinessProfile();
  const { data: licenceBalance } = useBusinessLicenceBalance();
  const updateProfile = useUpdateBusinessProfile();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [companySize, setCompanySize] = useState("");

  const startEdit = () => {
    if (!business) return;
    setPhone(business.phone ?? "");
    setAddress(business.address ?? "");
    setTaxId(business.tax_id ?? "");
    setCompanySize(String(business.company_size ?? ""));
    setEditing(true);
  };

  const onSave = async () => {
    if (!business) return;
    await updateProfile.mutateAsync({
      id: business.id,
      data: {
        phone,
        address,
        tax_id: taxId,
        company_size: companySize ? Number(companySize) : undefined,
      },
    });
    setEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BusinessPageHeader title="Business Profile" />
        <div className="border-neutral-30 h-64 animate-pulse rounded-xl border bg-white" />
      </div>
    );
  }

  if (isError || !business) {
    return (
      <div className="space-y-6">
        <BusinessPageHeader title="Business Profile" />
        <div className="border-neutral-30 rounded-xl border bg-white p-10 text-center text-sm text-red-600">
          Could not load business profile.
        </div>
      </div>
    );
  }

  const availableLicences = sumAvailableLicences(licenceBalance?.pools ?? []);
  const industry = INDUSTRY_LABELS[business.industry?.toLowerCase()] ?? business.industry ?? "—";

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Profile"
        description="Your company information and account status."
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#3F576F] hover:bg-[#33485d]"
                onClick={onSave}
                disabled={updateProfile.isPending}
              >
                Save
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={startEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Current Status" value={business.status} icon={Building2} tone="primary" />
        <KpiCard
          label="Available Licences"
          value={availableLicences}
          icon={KeyRound}
          tone="amber"
        />
        <KpiCard
          label="Member Since"
          value={formatDate(business.created_at)}
          icon={CalendarDays}
          tone="success"
        />
      </div>

      <div className="border-neutral-30 rounded-xl border bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {business.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logo_url}
              alt={business.company_name}
              className="border-neutral-30 h-20 w-20 rounded-lg border object-contain p-1"
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

        {editing ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-neutral-300 uppercase">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-300 uppercase">Tax ID</label>
              <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-300 uppercase">Company size</label>
              <Input
                type="number"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-neutral-300 uppercase">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="border-neutral-40 mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
        ) : (
          <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField label="Company Name" value={business.company_name} />
            <ProfileField label="Business Email" value={business.business_email} />
            <ProfileField label="Phone" value={business.phone} />
            <ProfileField label="Tax ID" value={business.tax_id} />
            <ProfileField label="Industry" value={industry} />
            <ProfileField label="Company Size" value={business.company_size} />
            <ProfileField label="Address" value={business.address} />
          </dl>
        )}
      </div>
    </div>
  );
}
