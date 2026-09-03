"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { BusinessDataTable, type Column } from "@/components/business/business-data-table";
import { StatusBadge } from "@/components/business/status-badge";
import { ManagerPermissionsModal } from "@/components/business/manager-permissions-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAddBusinessManager,
  useBusinessManagers,
  useBusinessProfile,
  useDeleteBusinessManager,
  useSetBusinessManagerStatus,
} from "@/lib/hooks/useBusinessDashboard";
import { businessDashboardService } from "@/lib/services/business-dashboard";
import { ApiError } from "@/lib/api/error";
import type { BusinessManager } from "@/types/business-dashboard";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function BusinessManagersPage() {
  const { data: business } = useBusinessProfile();
  const businessId = business?.id ?? null;
  const { data, isLoading, isError } = useBusinessManagers(businessId);

  const addManager = useAddBusinessManager();
  const setStatus = useSetBusinessManagerStatus();
  const deleteManager = useDeleteBusinessManager();

  const [addOpen, setAddOpen] = useState(false);
  const [permissionsFor, setPermissionsFor] = useState<BusinessManager | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BusinessManager | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const rows = data?.items ?? data?.managers ?? [];

  const resetAddForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setEmailNotice(null);
  };

  /**
   * Warn before submitting when the address already belongs to a manager here —
   * the API rejects duplicates, so catching it on blur saves a round trip.
   */
  const handleEmailBlur = async () => {
    if (!email || !businessId) return;
    setCheckingEmail(true);
    try {
      const result = await businessDashboardService.checkManagerEmail(email, businessId);
      if (result.is_manager) {
        setEmailNotice("This person is already a manager for your business.");
      } else if (result.exists) {
        setEmailNotice("An account with this email exists — they will be added as a manager.");
      } else {
        setEmailNotice(null);
      }
    } catch {
      setEmailNotice(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleAdd = () => {
    if (!businessId || !email || !firstName || !lastName) return;
    addManager.mutate(
      { business_id: businessId, email, first_name: firstName, last_name: lastName },
      {
        onSuccess: () => {
          setAddOpen(false);
          resetAddForm();
        },
      },
    );
  };

  const columns: Column<BusinessManager>[] = [
    { key: "name", header: "Name", cell: (r) => r.display_name },
    // The API field is user_email; the older `email` key was never populated by it.
    { key: "email", header: "Email", cell: (r) => r.user_email ?? r.email ?? "—" },
    { key: "role", header: "Role", cell: (r) => r.role ?? "manager" },
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
            onClick={() => setPermissionsFor(r)}
            aria-label={`Permissions for ${r.display_name}`}
          >
            <ShieldCheck className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={setStatus.isPending}
            onClick={() =>
              setStatus.mutate({
                id: r.id,
                status: r.status === "active" ? "inactive" : "active",
              })
            }
          >
            {r.status === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(r)}
            aria-label={`Remove ${r.display_name}`}
          >
            <Trash2 className="text-destructive h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Business Management"
        description="Managers who can help administer your business account."
        actions={
          <Button onClick={() => setAddOpen(true)} disabled={!businessId}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add manager
          </Button>
        }
      />

      {setStatus.isError ? (
        <p className="text-destructive text-sm">
          {errorMessage(setStatus.error, "Could not update status.")}
        </p>
      ) : null}
      {deleteManager.isError ? (
        <p className="text-destructive text-sm">
          {errorMessage(deleteManager.error, "Could not remove manager.")}
        </p>
      ) : null}

      <BusinessDataTable<BusinessManager>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No managers"
        emptyDescription="Add a manager to help administer your business."
      />

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add manager</DialogTitle>
            <DialogDescription>
              They receive an email with sign-in details if they do not already have an account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium" htmlFor="manager-first-name">
                  First name
                </label>
                <Input
                  id="manager-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="manager-last-name">
                  Last name
                </label>
                <Input
                  id="manager-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="manager-email">
                Email
              </label>
              <Input
                id="manager-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                className="mt-1"
              />
              {checkingEmail ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-neutral-300">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking…
                </p>
              ) : emailNotice ? (
                <p className="mt-1 text-xs text-neutral-300">{emailNotice}</p>
              ) : null}
            </div>

            {addManager.isError ? (
              <p className="text-destructive text-sm">
                {errorMessage(addManager.error, "Could not add manager.")}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!email || !firstName || !lastName || addManager.isPending}
            >
              {addManager.isPending ? "Adding…" : "Add manager"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove manager</DialogTitle>
            <DialogDescription>
              {confirmDelete
                ? `${confirmDelete.display_name} loses manager access to your business. Their user account is kept.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteManager.isPending}
              onClick={() => {
                if (!confirmDelete) return;
                deleteManager.mutate(confirmDelete.id, {
                  onSuccess: () => setConfirmDelete(null),
                });
              }}
            >
              {deleteManager.isPending ? "Removing…" : "Remove access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManagerPermissionsModal
        manager={permissionsFor}
        open={Boolean(permissionsFor)}
        onOpenChange={(open) => !open && setPermissionsFor(null)}
      />
    </div>
  );
}
