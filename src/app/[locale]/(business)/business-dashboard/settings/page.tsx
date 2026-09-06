"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { DepartmentsSection } from "@/components/business/departments-section";
import { SettingsSection, ToggleRow } from "@/components/business/settings-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectorCombobox } from "@/components/business/sector-combobox";
import { NOTIFICATION_KEYS, NOTIFICATION_LABELS } from "@/components/business/onboarding/answers";
import {
  useBusinessSettings,
  useResetSettings,
  useSectors,
  useUpdateBusinessSettings,
} from "@/lib/hooks/useBusinessDashboard";

const PASS_MARK_MIN = 50;
const PASS_MARK_MAX = 100;

export default function BusinessSettingsPage() {
  const { data: settings, isLoading, isError } = useBusinessSettings();
  const update = useUpdateBusinessSettings();
  const reset = useResetSettings();

  const { data: sectors, isLoading: sectorsLoading, isError: sectorsFailed } = useSectors();

  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  // The text in the box, which is not the answer: text with no committed
  // sector means "half-typed", which must never be read as "cleared".
  const [sectorDraft, setSectorDraft] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [passMark, setPassMark] = useState(80);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [error, setError] = useState("");

  /**
   * Seed the editable fields from the server, keyed on the server *values*
   * rather than the object identity.
   *
   * Adjusting state during render instead of in an effect, so the inputs are
   * correct on first paint. Keying on values means a background refetch that
   * returns the same record leaves an in-progress edit alone, while a save —
   * which does change them — re-seeds.
   */
  const serverValues = settings
    ? `${settings.company_name ?? ""}|${settings.company_sector ?? ""}|${settings.platform_subdomain ?? ""}|${settings.passing_mark}|${settings.phone ?? ""}|${settings.job_title ?? ""}`
    : null;
  const [seededFrom, setSeededFrom] = useState<string | null>(null);

  if (settings && serverValues !== seededFrom) {
    setSeededFrom(serverValues);
    setCompanyName(settings.company_name ?? "");
    setSector(settings.company_sector ?? "");
    setSectorDraft(settings.company_sector ?? "");
    setPhone(settings.phone ?? "");
    setJobTitle(settings.job_title ?? "");
    setSubdomain(settings.platform_subdomain ?? "");
    setPassMark(settings.passing_mark ?? 80);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BusinessPageHeader title="Settings" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border-neutral-30 h-40 animate-pulse rounded-xl border bg-white"
          />
        ))}
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <div className="space-y-6">
        <BusinessPageHeader title="Settings" />
        <div className="border-neutral-30 rounded-xl border bg-white p-10 text-center text-sm text-red-600">
          Could not load your settings.
        </div>
      </div>
    );
  }

  const save = async (payload: Parameters<typeof update.mutateAsync>[0]) => {
    setError("");
    try {
      await update.mutateAsync(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that change.");
    }
  };

  const sectorDirty = sector !== (settings.company_sector ?? "");

  const appearanceDirty =
    companyName !== (settings.company_name ?? "") ||
    sectorDirty ||
    subdomain !== (settings.platform_subdomain ?? "");

  /*
   * Typing in the combobox un-commits the sector, so `sector === ""` means
   * either "cleared" or "mid-edit" — and the two must not be treated alike.
   * Saving while half-typed used to send an empty sector, which the API
   * accepts, silently wiping the stored value. It is only ever half-typed
   * here, because this field has no way to deliberately clear a sector.
   */
  const sectorHalfTyped = sector === "" && sectorDraft.trim() !== "";

  /*
   * A changed sector must be one the vocabulary recognises — the same rule the
   * API enforces, applied here so a half-typed sector disables the button
   * rather than coming back as a 400.
   *
   * Only a *changed* one, though. Businesses registered before this vocabulary
   * existed hold free text ("technology"), which the API would now reject; if
   * an untouched legacy value gated this button, those tenants could never save
   * their company name either. An unchanged sector is left alone entirely —
   * see the payload below, which omits it.
   */
  const sectorUsable =
    !sectorHalfTyped && (!sectorDirty || sectorsFailed || (sectors ?? []).includes(sector));
  const passMarkDirty = passMark !== settings.passing_mark;
  const contactDirty = phone !== (settings.phone ?? "") || jobTitle !== (settings.job_title ?? "");

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Settings"
        description="How your organisation's training is configured."
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <SettingsSection
        title="Appearance"
        description="How your organisation is named across the dashboard."
        footer={
          <Button
            className="bg-[#3F576F] hover:bg-[#33485d]"
            disabled={!appearanceDirty || !sectorUsable || update.isPending}
            onClick={() =>
              save({
                company_name: companyName.trim(),
                platform_subdomain: subdomain.trim(),
                // Omitted unless it changed to something real. An empty sector
                // is never sent: the API accepts '' and would clear the stored
                // value, so sending it would wipe exactly the legacy sectors
                // this omission exists to preserve.
                ...(sectorDirty && sector.trim() !== "" ? { company_sector: sector.trim() } : {}),
              })
            }
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        }
      >
        <div>
          <Label htmlFor="company_name">Company name</Label>
          <Input
            id="company_name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 max-w-md"
          />
        </div>
        <div>
          <Label htmlFor="settings-sector">Sector</Label>
          <div className="mt-1 max-w-md">
            <SectorCombobox
              id="settings-sector"
              value={sector}
              onChange={setSector}
              onDraftChange={setSectorDraft}
              sectors={sectors ?? []}
              isLoading={sectorsLoading}
              isUnavailable={sectorsFailed}
            />
            {sectorHalfTyped ? (
              <p className="mt-1.5 text-xs text-neutral-300">
                Choose a sector from the list to save it.
              </p>
            ) : null}
          </div>
        </div>
        <div>
          <Label htmlFor="subdomain">Platform subdomain</Label>
          <Input
            id="subdomain"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            placeholder="acme"
            className="mt-1 max-w-md"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Passing mark"
        description="The score at or above which a completed course counts as passed. Reports recalculate against this."
        footer={
          <Button
            className="bg-[#3F576F] hover:bg-[#33485d]"
            disabled={!passMarkDirty || update.isPending}
            onClick={() => save({ passing_mark: passMark })}
          >
            {update.isPending ? "Saving…" : "Save passing mark"}
          </Button>
        }
      >
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={PASS_MARK_MIN}
            max={PASS_MARK_MAX}
            value={passMark}
            onChange={(e) => setPassMark(Number(e.target.value))}
            className="max-w-md flex-1 accent-[#3F576F]"
            aria-label="Passing mark"
          />
          <span className="w-16 text-right text-lg font-semibold text-neutral-900">
            {passMark}%
          </span>
        </div>
      </SettingsSection>

      <SettingsSection title="Certificates" description="Who can obtain a certificate, and when.">
        <ToggleRow
          label="Learners can download their own certificates"
          description={
            settings.certificate_self_download_locked
              ? "This decision is permanent for your organisation and can no longer be changed."
              : "Turning this off is permanent — it cannot be turned back on."
          }
          checked={settings.certificate_self_download}
          locked={settings.certificate_self_download_locked}
          disabled={update.isPending}
          onChange={(value) => save({ certificate_self_download: value })}
        />
        <ToggleRow
          label="Email the certificate on completion"
          checked={settings.email_certificate_on_completion}
          disabled={update.isPending}
          onChange={(value) => save({ email_certificate_on_completion: value })}
        />
      </SettingsSection>

      <SettingsSection
        title="Email notifications"
        description="The wizard tells managers these can be changed later, so they are editable here. They are stored but not yet acted on."
      >
        {NOTIFICATION_KEYS.map((key) => (
          <ToggleRow
            key={key}
            label={NOTIFICATION_LABELS[key]}
            checked={settings[key]}
            disabled={update.isPending}
            onChange={(value) => save({ [key]: value })}
          />
        ))}
      </SettingsSection>

      <SettingsSection
        title="Your details"
        description="Yours alone — each manager of this organisation keeps their own."
        footer={
          <Button
            className="bg-[#3F576F] hover:bg-[#33485d]"
            disabled={!contactDirty || update.isPending}
            onClick={() => save({ phone: phone.trim(), job_title: jobTitle.trim() })}
          >
            {update.isPending ? "Saving…" : "Save details"}
          </Button>
        }
      >
        <div>
          <Label htmlFor="job_title">Job title</Label>
          <Input
            id="job_title"
            value={jobTitle}
            placeholder="e.g. Training Manager"
            onChange={(e) => setJobTitle(e.target.value)}
            className="mt-1 max-w-md"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            placeholder="Enter your phone number"
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 max-w-md"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Departments"
        description="Group your learners. Every report and learner list can be filtered by department."
      >
        <DepartmentsSection />
      </SettingsSection>

      <SettingsSection
        title="Security"
        description="Stored with your organisation, but not yet enforced."
      >
        <ToggleRow
          label="Require multi-factor authentication"
          checked={settings.mfa_enabled}
          comingSoon
          onChange={(value) => save({ mfa_enabled: value })}
        />
      </SettingsSection>

      <SettingsSection
        title="Integrations"
        description="Stored with your organisation, but not yet connected."
      >
        <ToggleRow
          label="Slack"
          checked={settings.integration_slack}
          comingSoon
          onChange={(value) => save({ integration_slack: value })}
        />
        <ToggleRow
          label="Microsoft Teams"
          checked={settings.integration_teams}
          comingSoon
          onChange={(value) => save({ integration_teams: value })}
        />
        <ToggleRow
          label="Generative AI assistance"
          checked={settings.integration_genai}
          comingSoon
          onChange={(value) => save({ integration_genai: value })}
        />
      </SettingsSection>

      <SettingsSection
        title="Setup"
        description="Restore the defaults and run the setup wizard again."
      >
        {confirmingReset ? (
          <div className="space-y-3 rounded-lg bg-amber-50 p-4">
            <p className="flex items-start gap-2 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              This restores every setting on this page to its default and reopens the setup wizard.
              Your learners, course assignments and issued certificates are not touched.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                disabled={reset.isPending}
                onClick={async () => {
                  setError("");
                  try {
                    await reset.mutateAsync();
                  } catch {
                    setError("Could not reset your settings.");
                  } finally {
                    setConfirmingReset(false);
                  }
                }}
              >
                {reset.isPending ? "Resetting…" : "Reset and re-run setup"}
              </Button>
              <Button variant="outline" onClick={() => setConfirmingReset(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirmingReset(true)}>
            Reset and re-run setup wizard
          </Button>
        )}
      </SettingsSection>

      <SettingsSection
        title="Business profile"
        description="Your company details, logo and billing information."
      >
        <Link
          href="/business-dashboard/profile"
          className="text-sm font-medium text-[#3F576F] hover:underline"
        >
          Go to business profile
        </Link>
      </SettingsSection>
    </div>
  );
}
