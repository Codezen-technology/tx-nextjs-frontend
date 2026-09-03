"use client";

import { UserMinus } from "lucide-react";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { StatusBadge } from "@/components/business/status-badge";
import { Button } from "@/components/ui/button";
import { useRevokeSubscriptionSeat, useSubscriptionSeats } from "@/lib/hooks/useBusinessDashboard";
import { ApiError } from "@/lib/api/error";
import type { SubscriptionSeat } from "@/types/business-dashboard";

interface SubscriptionSeatsPanelProps {
  subscriptionId: number;
}

export function SubscriptionSeatsPanel({ subscriptionId }: SubscriptionSeatsPanelProps) {
  const { data, isLoading, isError } = useSubscriptionSeats(subscriptionId);
  const revokeSeat = useRevokeSubscriptionSeat();

  const seats = data?.seats ?? [];
  const counts = data?.counts;

  const columns: Column<SubscriptionSeat>[] = [
    {
      key: "learner",
      header: "Learner",
      cell: (s) => s.learner_name || (s.learner_id ? `User #${s.learner_id}` : "—"),
    },
    { key: "email", header: "Email", cell: (s) => s.learner_email || "—" },
    { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      headerClassName: "text-right",
      cell: (s) =>
        s.learner_id ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={revokeSeat.isPending}
            onClick={() => revokeSeat.mutate({ id: subscriptionId, seatId: s.id })}
            aria-label={`Free seat ${s.id}`}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Free seat
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-3">
      {counts ? (
        <p className="text-sm text-neutral-300">
          {counts.assigned} of {counts.total} seats in use · {counts.available} available
          {counts.suspended > 0 ? ` · ${counts.suspended} suspended` : ""}
        </p>
      ) : null}

      {revokeSeat.isError ? (
        <p className="text-destructive text-sm">
          {revokeSeat.error instanceof ApiError
            ? revokeSeat.error.message
            : "Could not free that seat."}
        </p>
      ) : null}

      <BusinessDataTable<SubscriptionSeat>
        columns={columns}
        rows={seats}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No seats"
        emptyDescription="This subscription has no seats yet."
      />
    </div>
  );
}
