"use client";

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
import {
  useAssignBusinessCourse,
  useBusinessAvailableLearners,
  useBusinessSystemType,
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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const { data: systemType } = useBusinessSystemType();
  const { data, isLoading } = useBusinessAvailableLearners(open ? courseId : null, {
    search,
    per_page: 50,
  });
  const assign = useAssignBusinessCourse();

  const learners = useMemo(() => data?.items ?? [], [data?.items]);
  const useLicence = systemType?.system_type !== "credits";

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setSearch("");
      setError("");
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
    try {
      await assign.mutateAsync({
        course_id: courseId,
        user_ids: Array.from(selected),
        use_licence: useLicence,
      });
      onOpenChange(false);
    } catch (err) {
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learners..."
            className="pl-9"
          />
        </div>

        <div className="max-h-64 overflow-y-auto rounded-lg border border-neutral-30">
          {isLoading ? (
            <p className="p-4 text-sm text-neutral-300">Loading learners…</p>
          ) : !learners.length ? (
            <p className="p-4 text-sm text-neutral-300">No learners found.</p>
          ) : (
            <ul className="divide-y divide-neutral-20">
              {learners.map((learner) => {
                const disabled = !learner.is_available;
                return (
                  <li key={learner.id}>
                    <label
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        disabled
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:bg-neutral-10",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(learner.id)}
                        disabled={disabled}
                        onChange={() => !disabled && toggle(learner.id)}
                        className="h-4 w-4 rounded border-neutral-40 disabled:cursor-not-allowed"
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
                        <span className="shrink-0 rounded-full bg-neutral-20 px-2 py-0.5 text-xs font-medium text-neutral-500">
                          {unavailableLabel(learner.assignment_status)}
                        </span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
