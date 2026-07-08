"use client";

import type { ReactNode } from "react";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";

export interface Column<T> {
  /** Stable key for the column. */
  key: string;
  header: ReactNode;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface BusinessDataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T, index: number) => string | number;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function BusinessDataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isError,
  errorMessage = "Could not load data. Please try again.",
  emptyTitle = "Nothing here yet",
  emptyDescription,
  page,
  totalPages,
  onPageChange,
  className,
}: BusinessDataTableProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="border-neutral-30 overflow-hidden rounded-xl border bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-neutral-30 bg-neutral-10 border-b">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-5 py-3 text-xs font-semibold tracking-wide text-neutral-300 uppercase",
                      col.headerClassName,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-neutral-30 divide-y">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-5 py-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-10 text-center text-sm text-red-600"
                  >
                    {errorMessage}
                  </td>
                </tr>
              ) : !rows || rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-2 py-2">
                    <EmptyState
                      className="border-0"
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={rowKey(row, i)} className="hover:bg-neutral-10 transition-colors">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn("px-5 py-4 text-sm text-neutral-700", col.className)}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {page != null && totalPages != null && onPageChange && totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      ) : null}
    </div>
  );
}
