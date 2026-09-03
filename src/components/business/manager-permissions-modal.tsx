"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useManagerCapabilities,
  useUpdateManagerPermissions,
} from "@/lib/hooks/useBusinessDashboard";
import { ApiError } from "@/lib/api/error";
import type { BusinessManager } from "@/types/business-dashboard";

interface ManagerPermissionsModalProps {
  manager: BusinessManager | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The API reports available capabilities either as a { key: label } map or a bare
 * list of keys, so normalise both into entries before rendering.
 */
function toEntries(available: Record<string, string> | string[] | undefined) {
  if (!available) return [] as Array<[string, string]>;
  if (Array.isArray(available)) return available.map((k) => [k, humanise(k)] as [string, string]);
  return Object.entries(available).map(([k, v]) => [k, v || humanise(k)] as [string, string]);
}

function humanise(key: string): string {
  return key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ManagerPermissionsModal({
  manager,
  open,
  onOpenChange,
}: ManagerPermissionsModalProps) {
  const managerId = manager?.user_id ?? null;
  const { data, isLoading, isError, error } = useManagerCapabilities(open ? managerId : null);
  const updatePermissions = useUpdateManagerPermissions();

  // Derive the draft rather than syncing server state into local state in an effect.
  // Overrides are scoped to a manager id, so switching managers discards them without
  // needing a reset.
  const [overrides, setOverrides] = useState<{
    managerId: number | null;
    values: Record<string, boolean>;
  }>({ managerId: null, values: {} });

  const activeOverrides = overrides.managerId === managerId ? overrides.values : {};
  const draft: Record<string, boolean> = { ...(data?.permissions ?? {}), ...activeOverrides };

  const setCapability = (key: string, granted: boolean) =>
    setOverrides((prev) => ({
      managerId,
      values: { ...(prev.managerId === managerId ? prev.values : {}), [key]: granted },
    }));

  const entries = toEntries(data?.available);

  const handleSave = () => {
    if (!managerId) return;
    updatePermissions.mutate(
      { managerId, permissions: draft },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const forbidden = isError && error instanceof ApiError && error.status === 403;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Permissions</DialogTitle>
          <DialogDescription>
            {manager ? `What ${manager.display_name} can do in your business.` : ""}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-6 text-sm text-neutral-300">Loading permissions…</p>
        ) : forbidden ? (
          <p className="py-6 text-sm text-neutral-300">
            Only the business owner can view or change manager permissions.
          </p>
        ) : isError ? (
          <p className="text-destructive py-6 text-sm">Could not load permissions.</p>
        ) : entries.length === 0 ? (
          <p className="py-6 text-sm text-neutral-300">No configurable permissions.</p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto py-2">
            {entries.map(([key, label]) => (
              <li key={key}>
                <label className="hover:bg-neutral-10 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(draft[key])}
                    onChange={(e) => setCapability(key, e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {updatePermissions.isError ? (
          <p className="text-destructive text-sm">
            {updatePermissions.error instanceof ApiError
              ? updatePermissions.error.message
              : "Could not save permissions."}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || forbidden || updatePermissions.isPending || entries.length === 0}
          >
            {updatePermissions.isPending ? "Saving…" : "Save permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
