"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoCardsSection } from "@/components/dashboard/promo-cards-section";
import { DashboardErrorBanner } from "@/components/dashboard/dashboard-error-banner";
import { useStudentSubscription, useSubscriptionPlans } from "@/lib/hooks/useStudentDashboard";
import type { SubscriptionPlan } from "@/types/student-dashboard";
import { cn } from "@/lib/utils/cn";

function PlanCard({ plan }: { plan: SubscriptionPlan }) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        plan.featured && "ring-lms-secondary/30 border-lms-secondary shadow-md ring-2",
      )}
    >
      {plan.featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lms-secondary">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{plan.label}</CardTitle>
        {plan.subtitle && <p className="text-sm text-muted-foreground">{plan.subtitle}</p>}
        <div className="mt-2">
          {plan.price !== null && (
            <span className="text-3xl font-bold">
              {plan.currency}
              {plan.price}
            </span>
          )}
          {plan.billing && (
            <span className="ml-1 text-sm text-muted-foreground">{plan.billing}</span>
          )}
          {plan.regular_price && plan.regular_price > (plan.price ?? 0) && (
            <span className="ml-2 text-sm text-muted-foreground line-through">
              {plan.currency}
              {plan.regular_price}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ul className="mb-6 flex-1 space-y-2">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {f.included ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-lms-secondary" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <span className={cn(!f.included && "text-muted-foreground")}>{f.text}</span>
            </li>
          ))}
        </ul>
        {plan.checkout_url && (
          <Button asChild className="hover:bg-lms-primary/90 w-full bg-lms-primary">
            <Link href={plan.checkout_url}>{plan.cta}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function SubscriptionPage() {
  const { data: subscription, isLoading: subLoading, isError: subError } = useStudentSubscription();
  const { data: plans, isLoading: plansLoading, isError: plansError } = useSubscriptionPlans();

  const active = subscription?.active_subscription;
  const lifetime = subscription?.lifetime_membership;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#2e4450]">Subscriptions</h1>

      {(subError || plansError) && <DashboardErrorBanner />}

      {subLoading ? (
        <Skeleton className="mb-8 h-32 w-full rounded-xl" />
      ) : active || lifetime?.purchased ? (
        <Card className="border-lms-secondary/30 bg-lms-secondary/5 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {active && (
              <div className="space-y-1">
                <p className="font-semibold text-[#2e4450]">{active.plan_name}</p>
                <p className="text-sm text-[#586973]">
                  Status: <span className="capitalize">{active.status}</span>
                </p>
                {active.billing && (
                  <p className="text-sm text-[#586973]">
                    {active.billing.currency}
                    {active.billing.amount} / {active.billing.cycle}
                  </p>
                )}
                {active.actions?.manageUrl && (
                  <Button asChild variant="link" className="h-auto p-0 text-lms-secondary">
                    <a href={active.actions.manageUrl} target="_blank" rel="noopener noreferrer">
                      Manage subscription ↗
                    </a>
                  </Button>
                )}
              </div>
            )}
            {lifetime?.purchased && !active && (
              <div>
                <p className="font-semibold">{lifetime.product.name}</p>
                <p className="text-sm text-[#586973]">Lifetime membership</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="mb-8 text-[#586973]">You don&apos;t have an active subscription yet.</p>
      )}

      <h2 className="mb-4 text-xl font-bold text-[#2e4450]">Available Plans</h2>
      {plansLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <PlanCard key={plan.type} plan={plan} />
          ))}
        </div>
      )}

      <PromoCardsSection />
    </div>
  );
}
