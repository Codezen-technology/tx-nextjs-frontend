"use client";

import { useState } from "react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { useBusinessCreditTransactions } from "@/lib/hooks/useBusinessDashboard";
import type { CreditTransaction } from "@/types/business-dashboard";

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

export default function BusinessCreditTransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useBusinessCreditTransactions(page);

  const rows = data?.items ?? data?.transactions ?? [];
  const totalPages = data?.pages ?? 1;

  const columns: Column<CreditTransaction>[] = [
    { key: "date", header: "Date", cell: (r) => formatDate(r.created_at) },
    { key: "type", header: "Type", cell: (r) => r.type },
    { key: "amount", header: "Amount", cell: (r) => r.amount },
    { key: "balance", header: "Balance after", cell: (r) => r.balance_after ?? "—" },
    { key: "desc", header: "Description", cell: (r) => r.description ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Credit Transactions"
        description="A log of credit purchases and usage."
      />

      <BusinessDataTable<CreditTransaction>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No transactions"
        emptyDescription="Credit activity will appear here."
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
