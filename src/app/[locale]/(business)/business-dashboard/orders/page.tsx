"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Receipt } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { StatusBadge } from "@/components/business/status-badge";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBusinessOrders, useBusinessProfile } from "@/lib/hooks/useBusinessDashboard";
import type { BusinessOrder } from "@/types/business-dashboard";

const PER_PAGE = 10;

/** WooCommerce order statuses, matching the legacy Billing page's filter. */
const STATUS_OPTIONS = [
  { value: "any", label: "Any status" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending payment" },
  { value: "on-hold", label: "On hold" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

function formatMoney(total: string | number, currency?: string) {
  const n = typeof total === "string" ? parseFloat(total) : total;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "GBP",
  }).format(Number.isNaN(n) ? 0 : n);
}

function InfoCard({
  title,
  icon: Icon,
  children,
  footer,
}: {
  title: string;
  icon: typeof Receipt;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="border-neutral-30 rounded-xl border bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#3F576F]" />
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      </div>
      <div className="space-y-2 text-sm">{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-neutral-300">{label}</span>
      <span className="text-right font-medium text-neutral-900">{value || "—"}</span>
    </div>
  );
}

export default function BusinessOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("any");

  const { data, isLoading, isError } = useBusinessOrders({
    page,
    per_page: PER_PAGE,
    status: status === "any" ? undefined : status,
  });
  const { data: business } = useBusinessProfile();

  const rows = data?.items ?? data?.orders ?? [];
  const totalPages = data?.pages ?? 1;
  // The payment method on file is whatever the most recent order used.
  const latestOrder = rows[0];

  const columns: Column<BusinessOrder>[] = [
    {
      key: "number",
      header: "Order",
      cell: (row) =>
        row.view_url ? (
          <a
            href={row.view_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#3F576F] hover:underline"
          >
            #{row.order_number}
          </a>
        ) : (
          <span className="font-medium text-neutral-900">#{row.order_number}</span>
        ),
    },
    { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "total",
      header: "Total",
      cell: (row) => formatMoney(row.total, row.currency),
    },
    { key: "items", header: "Items", cell: (row) => row.items_count },
    {
      key: "payment",
      header: "Payment",
      cell: (row) => row.payment_method ?? "—",
    },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Billing"
        description="Your purchase history and billing details."
      />

      <div className="flex justify-end">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="border-neutral-30 h-10 w-[200px] rounded-lg bg-white text-sm">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <BusinessDataTable<BusinessOrder>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.order_id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No orders yet"
        emptyDescription="Purchases will appear here."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InfoCard
          title="Billing information"
          icon={Receipt}
          footer={
            <Link
              href="/business-dashboard/profile"
              className="text-sm font-medium text-[#3F576F] hover:underline"
            >
              Edit business profile
            </Link>
          }
        >
          <Row label="Company" value={business?.company_name} />
          <Row label="Email" value={business?.business_email} />
          <Row label="Phone" value={business?.phone} />
          <Row label="Address" value={business?.address} />
          <Row label="Tax ID" value={business?.tax_id} />
        </InfoCard>

        <InfoCard
          title="Payment method"
          icon={CreditCard}
          footer={
            <p className="text-xs text-neutral-300">
              Payment methods are managed in your WooCommerce account.
            </p>
          }
        >
          {latestOrder ? (
            <>
              <Row label="Method" value={latestOrder.payment_method} />
              <Row label="Last used" value={formatDate(latestOrder.date)} />
              <Row
                label="Last charge"
                value={formatMoney(latestOrder.total, latestOrder.currency)}
              />
            </>
          ) : (
            <p className="text-neutral-300">No payment method on file yet.</p>
          )}
        </InfoCard>
      </div>
    </div>
  );
}
