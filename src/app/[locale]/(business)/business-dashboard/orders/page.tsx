"use client";

import { useState } from "react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { StatusBadge } from "@/components/business/status-badge";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { useBusinessOrders } from "@/lib/hooks/useBusinessDashboard";
import type { BusinessOrder } from "@/types/business-dashboard";

const PER_PAGE = 10;

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
  }).format(n);
}

export default function BusinessOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useBusinessOrders({ page, per_page: PER_PAGE });

  const rows = data?.items ?? data?.orders ?? [];
  const totalPages = data?.pages ?? 1;

  const columns: Column<BusinessOrder>[] = [
    { key: "number", header: "Order", cell: (row) => `#${row.order_number}` },
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
      <BusinessPageHeader title="Order History" description="Your WooCommerce purchase history." />

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
    </div>
  );
}
