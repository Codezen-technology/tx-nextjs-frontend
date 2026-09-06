"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/error";
import {
  useAssignBusinessCourse,
  useBusinessAvailableLearners,
  useBusinessProfile,
  useDepartments,
  useLearnerSubscriptionChecks,
} from "@/lib/hooks/useBusinessDashboard";
import { cn } from "@/lib/utils/cn";

interface AssignCourseModalProps {
  courseId: number | null;
  courseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function unavailableLabel(status?: string): string {
  if (status === "assigned") return "Assigned";
  if (status === "wplms_enrolled") return "Already enrolled";
  return "Unavailable";
}

export function AssignCourseModal({
  courseId,
  courseName,
  open,
  onOpenChange,
}: AssignCourseModalProps) {
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [noLicence, setNoLicence] = useState(false);

  const { data: departments } = useDepartments();
  const { data, isLoading } = useBusinessAvailableLearners(open ? courseId : null, {
    search,
    per_page: 50,
    ...(departmentId ? { department_id: departmentId } : {}),
  });
  const assign = useAssignBusinessCourse();

  const learners = useMemo(() => data?.items ?? [], [data?.items]);

  const { data: business } = useBusinessProfile();

  /**
   * A subscription-covered learner does not spend a licence. Surfacing that
   * before assignment lets a manager use the pool deliberately, rather than
   * finding out via a 409 on submit.
   */
  const assignableIds = useMemo(
    () => learners.filter((l) => l.is_available).map((l) => l.id),
    [learners],
  );
  const { data: subscriptionChecks } = useLearnerSubscriptionChecks(
    open ? assignableIds : [],
    business?.user_id ?? null,
  );

  const coveredCount = useMemo(
    () =>
      Array.from(selected).filter(
        (id) => subscriptionChecks?.results?.[String(id)]?.has_subscription,
      ).length,
    [selected, subscriptionChecks],
  );

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setSearch("");
      setDepartmentId(0);
      setError("");
      setNoLicence(false);
    }
  }, [open]);

  const toggle = (userId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const onAssign = async () => {
    if (!courseId || selected.size === 0) return;
    setError("");
    setNoLicence(false);
    try {
      await assign.mutateAsync({
        course_id: courseId,
        user_ids: Array.from(selected),
      });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === "no_licence_available") {
        setNoLicence(true);
        setError("No licence or seat available for this course.");
        return;
      }
      setError(err instanceof Error ? err.message : "Assignment failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign course</DialogTitle>
          <DialogDescription>
            Select learners to assign to <strong>{courseName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-300" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search learners..."
              className="pl-9"
            />
          </div>

          {departments?.flat.length ? (
            <select
              value={departmentId || ""}
              onChange={(e) => setDepartmentId(Number(e.target.value) || 0)}
              aria-label="Filter by department"
              className="border-neutral-30 h-9 shrink-0 rounded-lg border bg-white px-2 text-sm text-neutral-900"
            >
              <option value="">All departments</option>
              {departments.flat.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="border-neutral-30 max-h-64 overflow-y-auto rounded-lg border">
          {isLoading ? (
            <p className="p-4 text-sm text-neutral-300">Loading learners…</p>
          ) : !learners.length ? (
            <p className="p-4 text-sm text-neutral-300">No learners found.</p>
          ) : (
            <ul className="divide-neutral-20 divide-y">
              {learners.map((learner) => {
                const disabled = !learner.is_available;
                return (
                  <li key={learner.id}>
                    <label
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        disabled
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-neutral-10 cursor-pointer",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(learner.id)}
                        disabled={disabled}
                        onChange={() => !disabled && toggle(learner.id)}
                        className="border-neutral-40 h-4 w-4 rounded disabled:cursor-not-allowed"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-neutral-900">
                          {learner.display_name}
                        </span>
                        <span className="block truncate text-xs text-neutral-300">
                          {learner.email}
                        </span>
                      </span>
                      {disabled ? (
                        <span className="bg-neutral-20 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-neutral-500">
                          {unavailableLabel(learner.assignment_status)}
                        </span>
                      ) : subscriptionChecks?.results?.[String(learner.id)]?.has_subscription ? (
                        <span
                          title="Covered by a subscription seat — assigning will not use a licence"
                          className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        >
                          Subscription
                        </span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected.size > 0 ? (
          <p className="text-sm text-neutral-300">
            {selected.size} selected
            {coveredCount > 0
              ? ` · ${coveredCount} covered by a subscription, ${selected.size - coveredCount} will use a licence`
              : " · each will use a licence"}
          </p>
        ) : null}

        {error ? (
          <div className="space-y-2">
            <p className="text-sm text-red-600">{error}</p>
            {noLicence ? (
              <Link
                href="/business-dashboard/pricing"
                className="text-sm font-medium text-[#3F576F] hover:underline"
              >
                Buy licences
              </Link>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#3F576F] hover:bg-[#33485d]"
            disabled={selected.size === 0 || assign.isPending}
            onClick={onAssign}
          >
            {assign.isPending ? "Assigning…" : `Assign (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
