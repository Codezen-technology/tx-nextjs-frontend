"use client";

import { useState } from "react";
import { Archive, KeyRound, Mail, RotateCcw, ShieldCheck, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/business/status-badge";
import {
  useConvertBusinessLearnerRole,
  useInviteLearner,
  useSendPasswordReset,
  useUpdateBusinessLearner,
} from "@/lib/hooks/useBusinessDashboard";
import { useBusinessCapabilities } from "@/lib/hooks/useBusinessCapabilities";
import { deriveLearnerStatus } from "@/lib/utils/business-learners";
import type { Learner } from "@/types/business-dashboard";

function formatDateTime(value?: string | null) {
  if (!value) return "Never";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "Never" : d.toLocaleString("en-GB");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-neutral-300">{label}</span>
      <span className="text-right text-sm font-medium text-neutral-900">{children}</span>
    </div>
  );
}

/**
 * Account actions for one learner.
 *
 * Archive and restore are `PATCH /team/{id} { status }` rather than the legacy
 * `/archive` and `/restore` sub-routes — same effect, one endpoint.
 *
 * Invite and password reset both ride core `retrieve_password()` on the
 * backend, so neither ever returns a credential; the confirmation only names
 * the address the mail went to.
 */
export function LearnerOptionsRail({ learner }: { learner: Learner }) {
  const { isOwner } = useBusinessCapabilities();
  const updateLearner = useUpdateBusinessLearner();
  const convertRole = useConvertBusinessLearnerRole();
  const invite = useInviteLearner();
  const passwordReset = useSendPasswordReset();
  const [confirmingRole, setConfirmingRole] = useState(false);
  const [notice, setNotice] = useState("");

  const displayStatus = deriveLearnerStatus(learner);
  const archived = displayStatus === "archived";
  const nextRole = learner.role === "manager" ? "learner" : "manager";
  const busy =
    updateLearner.isPending || convertRole.isPending || invite.isPending || passwordReset.isPending;

  const sendAccountEmail = async (
    action: "invite" | "reset",
    mutate: (id: number) => Promise<{ sent: boolean; email?: string }>,
  ) => {
    setNotice("");
    try {
      const result = await mutate(learner.id);
      const target = result.email ?? "their email address";
      setNotice(
        action === "invite"
          ? `Login invitation sent to ${target}.`
          : `Password reset sent to ${target}.`,
      );
    } catch {
      setNotice("That email could not be sent. Please try again.");
    }
  };

  return (
    <aside className="border-neutral-30 space-y-5 rounded-xl border bg-white p-6 shadow-xs">
      <h3 className="text-lg font-semibold text-neutral-900">Learner options</h3>

      <div className="space-y-3">
        <Field label="Role">
          <StatusBadge status={learner.role} />
        </Field>
        <Field label="Status">
          <StatusBadge status={displayStatus} />
        </Field>
        <Field label="Last login">{formatDateTime(learner.last_login)}</Field>
        {learner.departments?.length ? (
          <Field label="Departments">{learner.departments.map((d) => d.name).join(", ")}</Field>
        ) : null}
      </div>

      <div className="border-neutral-30 space-y-2 border-t pt-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={busy}
          onClick={() => sendAccountEmail("invite", (id) => invite.mutateAsync(id))}
        >
          <Mail className="mr-2 h-4 w-4" />
          Send login invite
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={busy}
          onClick={() => sendAccountEmail("reset", (id) => passwordReset.mutateAsync(id))}
        >
          <KeyRound className="mr-2 h-4 w-4" />
          Send password reset
        </Button>

        {isOwner ? (
          confirmingRole ? (
            <div className="space-y-2 rounded-lg bg-amber-50 p-3">
              <p className="text-sm text-amber-900">
                Convert {learner.display_name} to a {nextRole}? This changes what they can access.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    convertRole.mutate(
                      { id: learner.id, role: nextRole },
                      { onSettled: () => setConfirmingRole(false) },
                    );
                  }}
                >
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmingRole(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={busy}
              onClick={() => setConfirmingRole(true)}
            >
              {learner.role === "manager" ? (
                <UserCog className="mr-2 h-4 w-4" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Convert to {nextRole}
            </Button>
          )
        ) : null}

        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={busy}
          onClick={() =>
            updateLearner.mutate({ id: learner.id, status: archived ? "active" : "inactive" })
          }
        >
          {archived ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore learner
            </>
          ) : (
            <>
              <Archive className="mr-2 h-4 w-4" />
              Archive learner
            </>
          )}
        </Button>

        {notice ? <p className="text-sm text-[#3F576F]">{notice}</p> : null}

        {updateLearner.isError || convertRole.isError ? (
          <p className="text-sm text-red-600">That action failed. Please try again.</p>
        ) : null}
      </div>
    </aside>
  );
}
