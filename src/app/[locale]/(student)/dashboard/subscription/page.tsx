"use client";

import { useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PromoCardsSection } from "@/components/dashboard/promo-cards-section";
import { DashboardErrorBanner } from "@/components/dashboard/dashboard-error-banner";
import { useStudentSubscription, useSubscriptionPlans } from "@/lib/hooks/useStudentDashboard";
import type { SubscriptionPlan } from "@/types/student-dashboard";
import { cn } from "@/lib/utils/cn";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function capitalize(str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function formatAmount(amount: number, currency: string): string {
  return `${currency}${amount.toFixed(0)}`;
}

// ─── User counter ─────────────────────────────────────────────────────────────

function UserCounter({ count, onChange }: { count: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-[#eaecee] bg-white px-1.5 py-1.5 shadow-sm">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, count - 1))}
        disabled={count <= 1}
        aria-label="Decrease users"
        className="rounded-md bg-[#e7e9f2] p-1 text-[#374151] transition-colors hover:bg-[#d0d4e8] disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[44px] text-center text-sm font-semibold text-[#374151]">
        {count} {count === 1 ? "User" : "Users"}
      </span>
      <button
        type="button"
        onClick={() => onChange(count + 1)}
        aria-label="Increase users"
        className="hover:bg-lms-primary/90 rounded-md bg-lms-primary p-1 text-white transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

function PricingCard({
  plan,
  userCount,
  onCountChange,
}: {
  plan: SubscriptionPlan;
  userCount: number;
  onCountChange: (n: number) => void;
}) {
  const isFeatured = plan.featured;
  const isTeam = plan.type === "team";
  const totalPrice = plan.price != null ? plan.price * userCount : null;
  const checkoutUrl = plan.checkout_url
    ? isTeam
      ? plan.checkout_url
      : `${plan.checkout_url}&quantity=${userCount}`
    : null;

  return (
    <div
      className={cn(
        "flex w-full max-w-sm flex-col items-center overflow-hidden rounded-2xl",
        isFeatured && "gap-2 border-2 border-[#0e1e72] bg-[#0e1e72] pt-4",
      )}
    >
      {isFeatured && (
        <div className="inline-flex items-center gap-1 rounded-lg border border-[#4f6bed] bg-[#1e2a78] px-3 py-1 shadow">
          <span className="text-base">⭐</span>
          <span className="text-sm font-bold text-white">ONE TIME PAYMENT</span>
        </div>
      )}

      <div className="w-full overflow-hidden rounded-2xl">
        {/* Price header */}
        <div className="flex justify-center bg-[#f6f6fa] px-4 pt-4">
          <div className="flex min-h-[234px] w-full flex-col items-center justify-center gap-4 rounded-lg border border-[#b5bad7]/50 bg-white py-6">
            <h3 className="text-center text-lg font-bold text-[#586973]">{plan.label}</h3>

            {!isTeam && totalPrice != null ? (
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-[2.5rem] font-extrabold leading-tight text-lms-primary">
                    {formatAmount(totalPrice, plan.currency)}
                  </span>
                  {plan.regular_price && plan.regular_price > 0 && (
                    <span className="text-[1.1rem] text-red-600 line-through">
                      ({formatAmount(plan.regular_price * userCount, plan.currency)})
                    </span>
                  )}
                </div>
                {plan.billing && <p className="text-[#586973]">{plan.billing}</p>}
              </div>
            ) : isTeam ? (
              <p className="text-center text-[#475569]">{plan.subtitle}</p>
            ) : (
              <Skeleton className="h-12 w-32" />
            )}

            {!isTeam && <UserCounter count={userCount} onChange={onCountChange} />}
          </div>
        </div>

        {/* Features + CTA */}
        <div className="flex flex-col gap-6 bg-[#f6f6fa] p-6">
          <div>
            <p className="mb-4 text-base font-semibold text-[#374151]">What&apos;s included</p>
            <ul className="space-y-4">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  {f.included ? (
                    <Check className="h-[18px] w-[18px] shrink-0 text-[#16c2d5]" />
                  ) : (
                    <X className="h-[18px] w-[18px] shrink-0 text-destructive" />
                  )}
                  <span className="text-base leading-normal text-[#586973]">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {checkoutUrl ? (
            <a
              href={checkoutUrl}
              className={cn(
                "flex h-14 items-center justify-center rounded-lg text-[1.05rem] font-bold transition-colors",
                isFeatured
                  ? "bg-[#3f4d97] text-white hover:bg-[#0f217d]"
                  : "bg-[#e7e9f2] text-lms-primary hover:bg-[#d0d4e8]",
              )}
            >
              {plan.cta}
            </a>
          ) : (
            <a
              href={plan.request_invoice_url || "#request-invoice"}
              className="flex h-14 items-center justify-center rounded-lg bg-[#e7e9f2] text-[1.05rem] font-bold text-lms-primary transition-colors hover:bg-[#d0d4e8]"
            >
              {plan.cta}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pricing section (no subscription) ────────────────────────────────────────

function PricingSection() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const [userCounts, setUserCounts] = useState<Record<string, number>>({
    prime: 1,
    lifetime: 1,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-stretch justify-center gap-8 lg:flex-row">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[500px] w-full max-w-sm rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!plans?.length) return null;

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-[#586973]">
          Get Unlimited Course Access for You or Your Team
        </h2>
        <p className="mt-1 text-[#586973]">
          Access 300+ Courses, Certificates, Transcripts, Student ID and more
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-end">
        {plans.map((plan) => (
          <PricingCard
            key={plan.type}
            plan={plan}
            userCount={userCounts[plan.type] ?? 1}
            onCountChange={(count) => setUserCounts((prev) => ({ ...prev, [plan.type]: count }))}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Status chip ──────────────────────────────────────────────────────────────

function StatusChip({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-bold tracking-wide",
        active
          ? "border-[#00bc7d]/20 bg-[#00bc7d]/10 text-[#00bc7d]"
          : "border-[#bec5c9] bg-[#f7f8f8] text-[#73828a]",
      )}
    >
      <span className={cn("h-2.5 w-2.5 rounded-full", active ? "bg-[#00bc7d]" : "bg-[#73828a]")} />
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { data, isLoading, isError } = useStudentSubscription();

  const activeSub = data?.active_subscription ?? null;
  const lifetime = data?.lifetime_membership ?? null;
  const hasSubscription = !!activeSub || !!lifetime?.purchased;
  const isActive = activeSub?.status === "active" || (lifetime?.purchased === true && !activeSub);

  return (
    <div>
      {/* Header */}
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-none text-[#586973]">Subscription</h1>
          <p className="mt-1 text-[#586973]">Manage your plan and billing information.</p>
        </div>
        <div className="text-right">
          {isLoading ? (
            <Skeleton className="h-9 w-24 rounded-md" />
          ) : (
            <>
              <StatusChip active={isActive} />
              {!isActive && !isError && (
                <p className="mt-1 text-sm text-destructive">You currently have no subscription.</p>
              )}
            </>
          )}
        </div>
      </div>

      <hr className="mb-8 border-[#eaecee]" />

      {isError && <DashboardErrorBanner />}

      {/* Active subscription banner */}
      {hasSubscription &&
        (isLoading ? (
          <Skeleton className="mb-8 h-56 w-full rounded-3xl" />
        ) : (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-8 rounded-3xl bg-lms-primary p-8">
            <div className="min-w-[280px] flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-[#16c2d5]/20 px-2 py-1 text-[0.65rem] font-black tracking-wide text-[#16c2d5]">
                  CURRENT PLAN
                </span>
                {activeSub && (
                  <span className="text-xs font-semibold text-[#bec5c9]">Auto-renew on</span>
                )}
              </div>

              <div className="mb-2 flex items-center gap-1">
                <h2 className="text-xl font-bold leading-snug text-white">
                  {activeSub?.plan_name || lifetime?.title || "Prime Membership"}
                </h2>
                <span className="text-xl">⭐</span>
              </div>

              {activeSub && (
                <div className="space-y-0.5 text-[#bec5c9]">
                  <p>
                    You are currently on the{" "}
                    <span className="font-medium text-white">
                      {capitalize(activeSub.billing.cycle)}
                    </span>{" "}
                    billing cycle.
                  </p>
                  {activeSub.dates.renewal && (
                    <p>
                      Next payment of{" "}
                      <span className="font-medium text-white">
                        {activeSub.billing.currency}
                        {activeSub.billing.amount}
                      </span>{" "}
                      is scheduled for{" "}
                      <span className="font-medium text-white">
                        {formatDate(activeSub.dates.renewal)}
                      </span>
                      .
                    </p>
                  )}
                  {activeSub.dates.end && (
                    <p>
                      Subscription ends on:{" "}
                      <span className="font-medium text-white">
                        {formatDate(activeSub.dates.end)}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {lifetime?.purchased && !activeSub && (
                <p className="mt-1 text-[#bec5c9]">
                  Lifetime access — one-time purchase on{" "}
                  <span className="font-medium text-white">
                    {formatDate(lifetime.purchase_details?.date_completed)}
                  </span>
                </p>
              )}
            </div>

            {activeSub && (activeSub.actions.manageUrl || activeSub.actions.cancelUrl) && (
              <div className="flex min-w-[250px] flex-col gap-3">
                {activeSub.actions.manageUrl && (
                  <a
                    href={activeSub.actions.manageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-14 w-[250px] items-center justify-center rounded-full bg-[#16c2d5] px-6 font-bold text-[#2e4450] transition-colors hover:bg-[#13b0c2]"
                  >
                    Billing History
                  </a>
                )}
                {activeSub.actions.cancelUrl && (
                  <a
                    href={activeSub.actions.cancelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-14 w-[250px] items-center justify-center rounded-full bg-white px-6 font-bold text-[#2e4450] transition-colors hover:bg-white/90"
                  >
                    Turn off Auto Renewal
                  </a>
                )}
              </div>
            )}
          </div>
        ))}

      {/* No subscription → pricing cards */}
      {!isLoading && !hasSubscription && <PricingSection />}

      <PromoCardsSection />
    </div>
  );
}
