"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, PauseCircle, PlayCircle, UserPlus, Users } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { SeatRosterTable } from "@/components/business/seat-roster-table";
import { KpiCard } from "@/components/business/kpi-card";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { StatusBadge } from "@/components/business/status-badge";
import { SubscriptionSeatsPanel } from "@/components/business/subscription-seats-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAssignUserToSubscription,
  useBusinessLearners,
  useBusinessSubscriptionAssigned,
  useBusinessSubscriptionSummary,
  useSetSubscriptionStatus,
} from "@/lib/hooks/useBusinessDashboard";
import { ApiError } from "@/lib/api/error";
import type { AssignedSubscription } from "@/types/business-dashboard";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function BusinessSubscriptionsPage() {
  const { data: summary, isLoading: summaryLoading } = useBusinessSubscriptionSummary();
  const { data: assigned, isLoading: assignedLoading } = useBusinessSubscriptionAssigned({
    page: 1,
    per_page: 20,
  });
  const setStatus = useSetSubscriptionStatus();
  const assignUser = useAssignUserToSubscription();
  const { data: team } = useBusinessLearners({ page: 1, per_page: 100 });

  const [expanded, setExpanded] = useState<number | null>(null);
  const [assignFor, setAssignFor] = useState<AssignedSubscription | null>(null);
  const [selectedLearner, setSelectedLearner] = useState<string>("");

  const rows = assigned?.items ?? [];

  // The API keys the summary by plan type — { yearly: { total, assigned, available } } —
  // so totals are the sum across plans, not a flat field.
  const totals = useMemo(() => {
    const plans = Object.values(summary ?? {});
    return plans.reduce(
      (acc, p) => ({
        total: acc.total + (p?.total ?? 0),
        assigned: acc.assigned + (p?.assigned ?? 0),
        available: acc.available + (p?.available ?? 0),
      }),
      { total: 0, assigned: 0, available: 0 },
    );
  }, [summary]);

  const learners = team?.members ?? [];

  const columns: Column<AssignedSubscription>[] = [
    {
      key: "expand",
      header: "",
      className: "w-8",
      cell: (r) => (
        <button
          type="button"
          onClick={() => setExpanded((prev) => (prev === r.id ? null : r.id))}
          aria-label={expanded === r.id ? "Hide seats" : "Show seats"}
          className="text-neutral-300 hover:text-neutral-900"
        >
          {expanded === r.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
    },
    { key: "plan", header: "Plan", cell: (r) => r.plan_type },
    {
      key: "seats",
      header: "Seats",
      cell: (r) => `${r.assigned_seats} / ${r.total_seats} used`,
    },
    { key: "started", header: "Started", cell: (r) => r.start_date?.slice(0, 10) ?? "—" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      headerClassName: "text-right",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={r.available_seats < 1}
            onClick={() => setAssignFor(r)}
            title={r.available_seats < 1 ? "No seats available" : undefined}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assign
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={setStatus.isPending}
            onClick={() =>
              setStatus.mutate({
                id: r.id,
                status: r.status === "active" ? "on-hold" : "active",
              })
            }
          >
            {r.status === "active" ? (
              <>
                <PauseCircle className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Resume
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Subscription Management"
        description="Seats across your subscriptions, and who holds them."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Seats"
          value={summaryLoading ? "—" : totals.total}
          icon={Users}
          tone="primary"
        />
        <KpiCard
          label="In use"
          value={summaryLoading ? "—" : totals.assigned}
          icon={Users}
          tone="amber"
        />
        <KpiCard
          label="Available"
          value={summaryLoading ? "—" : totals.available}
          icon={Users}
          tone="success"
        />
      </div>

      {setStatus.isError ? (
        <p className="text-destructive text-sm">
          {errorMessage(
            setStatus.error,
            "Could not change the subscription status. Subscriptions without a linked WooCommerce record cannot be paused.",
          )}
        </p>
      ) : null}

      <BusinessDataTable<AssignedSubscription>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        isLoading={assignedLoading}
        emptyTitle="No subscriptions"
        emptyDescription="Subscriptions you purchase will appear here."
      />

      {expanded ? (
        <div className="border-neutral-10 rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold">Seats</h2>
          <SubscriptionSeatsPanel subscriptionId={expanded} />
        </div>
      ) : null}

      <Dialog
        open={Boolean(assignFor)}
        onOpenChange={(open) => {
          if (!open) {
            setAssignFor(null);
            setSelectedLearner("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a seat</DialogTitle>
            <DialogDescription>
              {assignFor
                ? `Seat a team member on the ${assignFor.plan_type} subscription. ${assignFor.available_seats} seat(s) available.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="assign-learner">
              Team member
            </label>
            <select
              id="assign-learner"
              className="border-input w-full rounded-md border px-3 py-2 text-sm"
              value={selectedLearner}
              onChange={(e) => setSelectedLearner(e.target.value)}
            >
              <option value="">Select a team member…</option>
              {learners.map((l) => (
                <option key={l.user_id} value={String(l.user_id)}>
                  {l.display_name} ({l.user_email ?? l.email})
                </option>
              ))}
            </select>

            {assignUser.isError ? (
              <p className="text-destructive text-sm">
                {errorMessage(assignUser.error, "Could not assign that seat.")}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignFor(null)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedLearner || assignUser.isPending}
              onClick={() => {
                if (!assignFor || !selectedLearner) return;
                assignUser.mutate(
                  {
                    user_id: Number(selectedLearner),
                    subscription_type: assignFor.plan_type,
                  },
                  {
                    onSuccess: () => {
                      setAssignFor(null);
                      setSelectedLearner("");
                    },
                  },
                );
              }}
            >
              {assignUser.isPending ? "Assigning…" : "Assign seat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Assigned learners</h2>
        <p className="text-sm text-neutral-300">Every seat across all of your subscriptions.</p>
        <SeatRosterTable />
      </div>
    </div>
  );
}
