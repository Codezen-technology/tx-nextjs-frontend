"use client";

import { useState } from "react";
import { Bookmark, Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateSavedReport,
  useDeleteSavedReport,
  useSavedReports,
  useUpdateSavedReport,
} from "@/lib/hooks/useBusinessDashboard";

type Filters = Record<string, string | number | undefined>;

interface SavedViewsProps {
  /** The filters currently on screen, saved verbatim. */
  currentFilters: Filters;
  onApply: (filters: Filters) => void;
  reportType?: string;
}

/**
 * Named filter sets for a report.
 *
 * Views are shared across the whole business, not per user — a manager saving
 * "Overdue fire safety" makes it available to every manager on the tenant. The
 * `filters` blob is opaque to the backend, so adding a filter here needs no
 * backend change.
 */
export function SavedViews({
  currentFilters,
  onApply,
  reportType = "learner-courses",
}: SavedViewsProps) {
  const { data: views, isLoading } = useSavedReports(reportType);
  const createView = useCreateSavedReport();
  const updateView = useUpdateSavedReport();
  const deleteView = useDeleteSavedReport();

  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState("");

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setError("");
    try {
      await action();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
      return false;
    }
  };

  return (
    <div className="border-neutral-30 space-y-3 rounded-xl border bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-900">
          <Bookmark className="h-4 w-4" />
          Saved views
        </span>

        {isLoading ? (
          <span className="text-sm text-neutral-300">Loading…</span>
        ) : views?.length ? (
          views.map((view) =>
            renamingId === view.id ? (
              <span key={view.id} className="flex items-center gap-1">
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="h-8 w-40"
                  aria-label={`Rename ${view.name}`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!renameValue.trim()}
                  onClick={async () => {
                    const ok = await run(
                      () => updateView.mutateAsync({ id: view.id, name: renameValue.trim() }),
                      "Could not rename that view.",
                    );
                    if (ok) setRenamingId(null);
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </span>
            ) : (
              <span
                key={view.id}
                className="border-neutral-30 hover:bg-neutral-10 flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-3"
              >
                <button
                  type="button"
                  className="text-sm text-neutral-700"
                  onClick={() => onApply(view.filters)}
                >
                  {view.name}
                </button>
                <button
                  type="button"
                  aria-label={`Rename ${view.name}`}
                  className="p-1 text-neutral-300 hover:text-neutral-900"
                  onClick={() => {
                    setRenamingId(view.id);
                    setRenameValue(view.name);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${view.name}`}
                  className="p-1 text-neutral-300 hover:text-red-600"
                  onClick={() =>
                    run(() => deleteView.mutateAsync(view.id), "Could not delete that view.")
                  }
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ),
          )
        ) : (
          <span className="text-sm text-neutral-300">None yet.</span>
        )}

        {naming ? (
          <span className="flex items-center gap-1">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="View name"
              className="h-8 w-44"
              aria-label="Name for this view"
            />
            <Button
              size="sm"
              disabled={!name.trim() || createView.isPending}
              onClick={async () => {
                const ok = await run(
                  () =>
                    createView.mutateAsync({
                      name: name.trim(),
                      filters: currentFilters,
                      report_type: reportType,
                    }),
                  "Could not save that view.",
                );
                if (ok) {
                  setName("");
                  setNaming(false);
                }
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setNaming(false)}>
              <X className="h-4 w-4" />
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setNaming(true)}>
            Save current view
          </Button>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
