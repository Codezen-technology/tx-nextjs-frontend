"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Loader2,
  PackageSearch,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DashboardErrorBanner } from "@/components/dashboard/dashboard-error-banner";
import {
  useAdminSubscriptionPlanSettings,
  useAdminProducts,
  useUpdateSubscriptionPlanSettings,
} from "@/lib/hooks/useStudentDashboard";
import type {
  SubscriptionPlanConfig,
  SubscriptionPlanSettings,
  WcProduct,
} from "@/types/student-dashboard";
import { cn } from "@/lib/utils/cn";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_META: Record<string, { title: string; description: string; color: string }> = {
  prime: {
    title: "Prime Plan",
    description: "Annual subscription — e.g. 300+ courses per user/year.",
    color: "bg-[#eef0f9] border-[#d0d5ef]",
  },
  lifetime: {
    title: "Lifetime Prime",
    description: "One-time purchase with lifetime access.",
    color: "bg-[#f0fdf4] border-[#bbf7d0]",
  },
  team: {
    title: "Team Plan",
    description: "No product required. Collects invoice requests.",
    color: "bg-[#fff7ed] border-[#fed7aa]",
  },
};

// ─── Product Picker ────────────────────────────────────────────────────────────

function ProductPicker({
  value,
  products,
  onChange,
}: {
  value: number;
  products: WcProduct[];
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = products.find((p) => p.id === value);
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border-input bg-background ring-offset-background hover:bg-accent focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? `${selected.name} — £${selected.price}` : "No product (show Invoice CTA)"}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div className="bg-popover absolute z-50 mt-1 w-full rounded-md border shadow-md">
          <div className="p-2">
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <ul className="max-h-56 overflow-auto">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(0);
                  setOpen(false);
                }}
                className={cn(
                  "hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-sm",
                  value === 0 && "text-lms-primary font-semibold",
                )}
              >
                {value === 0 && <Check className="h-4 w-4 shrink-0" />}
                <span className={value === 0 ? "" : "pl-6"}>No product (Invoice CTA)</span>
              </button>
            </li>
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-sm",
                    value === p.id && "text-lms-primary font-semibold",
                  )}
                >
                  {value === p.id && <Check className="h-4 w-4 shrink-0" />}
                  <span className={value === p.id ? "" : "pl-6"}>
                    {p.name}
                    <span className="text-muted-foreground ml-2">£{p.price}</span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-muted-foreground px-3 py-2 text-sm">No products found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Feature Editor ────────────────────────────────────────────────────────────

function FeatureEditor({
  features,
  onChange,
}: {
  features: SubscriptionPlanConfig["features"];
  onChange: (features: SubscriptionPlanConfig["features"]) => void;
}) {
  const update = (index: number, patch: Partial<{ text: string; included: boolean }>) => {
    const next = features.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };
  const remove = (index: number) => onChange(features.filter((_, i) => i !== index));
  const add = () => onChange([...features, { text: "", included: true }]);

  return (
    <div className="space-y-2">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => update(i, { included: !f.included })}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              f.included
                ? "border-[#16c2d5] bg-[#16c2d5]/10 text-[#16c2d5] hover:bg-[#16c2d5]/20"
                : "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20",
            )}
            title={f.included ? "Mark as not included" : "Mark as included"}
          >
            {f.included ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          </button>
          <Input
            value={f.text}
            onChange={(e) => update(i, { text: e.target.value })}
            className="h-8 flex-1 text-sm"
            placeholder="Feature text…"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-muted-foreground hover:text-destructive flex h-7 w-7 shrink-0 items-center justify-center rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-lms-primary flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        <Plus className="h-4 w-4" />
        Add feature
      </button>
    </div>
  );
}

// ─── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({
  type,
  plan,
  products,
  onChange,
}: {
  type: string;
  plan: SubscriptionPlanConfig;
  products: WcProduct[];
  onChange: (p: SubscriptionPlanConfig) => void;
}) {
  const meta = PLAN_META[type] ?? { title: type, description: "", color: "bg-muted border" };
  const hasProduct = plan.product_id > 0;

  return (
    <div className={cn("rounded-2xl border p-6", meta.color)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#2e4450]">{meta.title}</h3>
          <p className="text-sm text-[#586973]">{meta.description}</p>
        </div>
        <Badge
          className={cn(
            "shrink-0 text-xs font-semibold",
            hasProduct
              ? "border-[#16c2d5]/40 bg-[#16c2d5]/10 text-[#16c2d5]"
              : "border-[#e2e8ee] bg-white text-[#73828a]",
          )}
          variant="outline"
        >
          {hasProduct ? "Product linked" : "No product → Invoice"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Product picker */}
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block text-xs font-semibold tracking-wide text-[#586973] uppercase">
            WooCommerce Product
          </Label>
          <ProductPicker
            value={plan.product_id}
            products={products}
            onChange={(id) => onChange({ ...plan, product_id: id })}
          />
        </div>

        {/* Label */}
        <div>
          <Label
            htmlFor={`${type}-label`}
            className="mb-1.5 block text-xs font-semibold tracking-wide text-[#586973] uppercase"
          >
            Plan Label
          </Label>
          <Input
            id={`${type}-label`}
            value={plan.label}
            onChange={(e) => onChange({ ...plan, label: e.target.value })}
            className="h-9 text-sm"
          />
        </div>

        {/* Billing */}
        <div>
          <Label
            htmlFor={`${type}-billing`}
            className="mb-1.5 block text-xs font-semibold tracking-wide text-[#586973] uppercase"
          >
            Billing Text
          </Label>
          <Input
            id={`${type}-billing`}
            value={plan.billing ?? ""}
            onChange={(e) => onChange({ ...plan, billing: e.target.value || null })}
            placeholder="e.g. per user/year"
            className="h-9 text-sm"
          />
        </div>

        {/* CTA */}
        <div>
          <Label
            htmlFor={`${type}-cta`}
            className="mb-1.5 block text-xs font-semibold tracking-wide text-[#586973] uppercase"
          >
            Button Text (CTA)
          </Label>
          <Input
            id={`${type}-cta`}
            value={plan.cta}
            onChange={(e) => onChange({ ...plan, cta: e.target.value })}
            className="h-9 text-sm"
          />
        </div>

        {/* Invoice URL — always shown; required when no product */}
        <div>
          <Label
            htmlFor={`${type}-invoice-url`}
            className="mb-1.5 block text-xs font-semibold tracking-wide text-[#586973] uppercase"
          >
            Invoice / Contact URL{!hasProduct && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={`${type}-invoice-url`}
            value={plan.request_invoice_url}
            onChange={(e) => onChange({ ...plan, request_invoice_url: e.target.value })}
            placeholder="#request-invoice or /contact"
            className={cn(
              "h-9 text-sm",
              !hasProduct && !plan.request_invoice_url && "border-destructive",
            )}
          />
          <p className="mt-1 text-[11px] text-[#586973]">
            Used when no product is linked. Falls back to <code>#request-invoice</code>.
          </p>
        </div>

        {/* Subtitle — team only */}
        {type === "team" && (
          <div className="sm:col-span-2">
            <Label
              htmlFor="team-subtitle"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-[#586973] uppercase"
            >
              Subtitle
            </Label>
            <Input
              id="team-subtitle"
              value={(plan as SubscriptionPlanConfig & { subtitle?: string }).subtitle ?? ""}
              onChange={(e) =>
                onChange({ ...plan, subtitle: e.target.value } as SubscriptionPlanConfig)
              }
              placeholder="Custom solutions for your team"
              className="h-9 text-sm"
            />
          </div>
        )}

        {/* Featured toggle */}
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="button"
            role="switch"
            aria-checked={plan.featured}
            onClick={() => onChange({ ...plan, featured: !plan.featured })}
            className={cn(
              "focus:ring-ring relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:ring-2 focus:outline-hidden",
              plan.featured ? "bg-lms-primary" : "bg-[#d1d5db]",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
                plan.featured ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
          <span className="text-sm font-medium text-[#2e4450]">
            Featured plan
            {plan.featured && <span className="text-lms-primary ml-1">(⭐ highlighted)</span>}
          </span>
        </div>

        {/* Features editor */}
        <div className="sm:col-span-2">
          <Label className="mb-2 block text-xs font-semibold tracking-wide text-[#586973] uppercase">
            What&apos;s Included
          </Label>
          <FeatureEditor
            features={plan.features}
            onChange={(features) => onChange({ ...plan, features })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSubscriptionPlansPage() {
  const {
    data: settings,
    isLoading: settingsLoading,
    isError: settingsError,
  } = useAdminSubscriptionPlanSettings();
  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useAdminProducts();
  const {
    mutate: save,
    isPending: saving,
    isSuccess: saved,
    isError: saveError,
  } = useUpdateSubscriptionPlanSettings();

  const [draft, setDraft] = useState<SubscriptionPlanSettings | null>(null);
  const [dirty, setDirty] = useState(false);

  // Initialise draft from fetched settings.
  useEffect(() => {
    if (settings && !draft) {
      setDraft(settings);
    }
  }, [settings, draft]);

  const updatePlan = (type: keyof SubscriptionPlanSettings, plan: SubscriptionPlanConfig) => {
    setDraft((prev) => (prev ? { ...prev, [type]: plan } : prev));
    setDirty(true);
  };

  const handleSave = () => {
    if (!draft) return;
    save(draft, { onSuccess: () => setDirty(false) });
  };

  const isLoading = settingsLoading || productsLoading;

  // Admin access warning: if WC products failed (403), user is not an admin.
  const accessDenied = productsError;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2e4450]">Subscription Plan Settings</h1>
          <p className="mt-1 text-sm text-[#586973]">
            Configure which WooCommerce product powers each plan and edit the features list. When no
            product is linked, the plan CTA becomes&nbsp;
            <strong>Request an Invoice</strong>.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!dirty || saving || !draft}
          className="hover:bg-lms-primary/90 bg-lms-primary shrink-0"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : saved && !dirty ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {settingsError && <DashboardErrorBanner />}
      {saveError && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-sm">
          Failed to save. Please try again.
        </div>
      )}

      {accessDenied && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Admin access required</p>
            <p>You need WordPress administrator privileges to manage subscription plans.</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : productsLoading === false && products.length === 0 && !accessDenied ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#eaecee] bg-white p-4">
          <PackageSearch className="mt-0.5 h-5 w-5 shrink-0 text-[#586973]" />
          <p className="text-sm text-[#586973]">
            No WooCommerce products found. Plans will show &ldquo;Request an Invoice&rdquo; until
            products are published.
          </p>
        </div>
      ) : null}

      {draft && !accessDenied && (
        <div className="space-y-6">
          {(["prime", "lifetime", "team"] as const).map((type) => (
            <PlanCard
              key={type}
              type={type}
              plan={draft[type]}
              products={products}
              onChange={(updated) => updatePlan(type, updated)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
