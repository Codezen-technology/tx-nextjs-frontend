"use client";

import { useState } from "react";
import { ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from "@/lib/hooks/useBusinessDashboard";
import type { Department, DepartmentNode } from "@/types/business-dashboard";

const ROOT = 0;

function DepartmentRow({
  node,
  depth,
  flat,
  onRenamed,
  onDeleted,
}: {
  node: DepartmentNode;
  depth: number;
  flat: Department[];
  onRenamed: (id: number, name: string, parentId: number) => Promise<boolean>;
  onDeleted: (id: number) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);
  const [parentId, setParentId] = useState(node.parent_id);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // A department cannot be its own parent, nor a parent of its own ancestor.
  const descendantIds = new Set<number>();
  const collect = (n: DepartmentNode) => {
    descendantIds.add(n.id);
    n.children.forEach(collect);
  };
  collect(node);

  return (
    <li>
      <div
        className="hover:bg-neutral-10 flex items-center gap-2 rounded-lg px-2 py-2"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {depth > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-200" /> : null}

        {editing ? (
          <>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 max-w-56"
            />
            <select
              value={parentId}
              onChange={(e) => setParentId(Number(e.target.value))}
              aria-label="Parent department"
              className="border-neutral-30 h-8 rounded-lg border bg-white px-2 text-sm"
            >
              <option value={ROOT}>No parent</option>
              {flat
                .filter((d) => !descendantIds.has(d.id))
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
            <Button
              size="sm"
              disabled={!name.trim()}
              onClick={async () => {
                await onRenamed(node.id, name.trim(), parentId);
                setEditing(false);
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setName(node.name);
                setParentId(node.parent_id);
                setEditing(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
              {node.name}
            </span>
            <span className="shrink-0 text-xs text-neutral-300">
              {node.member_count} member{node.member_count === 1 ? "" : "s"}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              <span className="sr-only">Rename {node.name}</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span className="sr-only">Remove {node.name}</span>
            </Button>
          </>
        )}
      </div>

      {confirmingDelete ? (
        <div
          className="mb-2 space-y-2 rounded-lg bg-amber-50 p-3"
          style={{ marginLeft: `${depth * 20 + 8}px` }}
        >
          <p className="text-sm text-amber-900">
            Remove <strong>{node.name}</strong>? Its members stay on your team and simply lose this
            label; any sub-departments move up to {node.parent_id ? "its parent" : "the top level"}.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                await onDeleted(node.id);
                setConfirmingDelete(false);
              }}
            >
              Remove
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <DepartmentRow
              key={child.id}
              node={child}
              depth={depth + 1}
              flat={flat}
              onRenamed={onRenamed}
              onDeleted={onDeleted}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function DepartmentsSection() {
  const { data, isLoading, isError } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState(ROOT);
  const [error, setError] = useState("");

  const tree = data?.departments ?? [];
  const flat = data?.flat ?? [];

  const run = async (action: () => Promise<unknown>, fallback: string): Promise<boolean> => {
    setError("");
    try {
      await action();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
      return false;
    }
  };

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-lg bg-neutral-100" />;
  }

  if (isError) {
    return <p className="text-sm text-red-600">Could not load your departments.</p>;
  }

  return (
    <div className="space-y-4">
      {tree.length === 0 ? (
        <p className="text-sm text-neutral-300">
          No departments yet. Add one to group learners and filter every report by it.
        </p>
      ) : (
        <ul className="border-neutral-30 divide-neutral-30 divide-y rounded-lg border">
          {tree.map((node) => (
            <DepartmentRow
              key={node.id}
              node={node}
              depth={0}
              flat={flat}
              onRenamed={(id, name, parent_id) =>
                run(
                  () => updateDepartment.mutateAsync({ id, name, parent_id }),
                  "Could not rename that department.",
                )
              }
              onDeleted={(id) =>
                run(() => deleteDepartment.mutateAsync(id), "Could not remove that department.")
              }
            />
          ))}
        </ul>
      )}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          const ok = await run(
            () =>
              createDepartment.mutateAsync({
                name: newName.trim(),
                parent_id: newParent || undefined,
              }),
            "Could not add that department.",
          );
          // A failed create keeps what was typed — retyping it is the one
          // thing the error message should not require.
          if (ok) {
            setNewName("");
            setNewParent(ROOT);
          }
        }}
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New department name"
          className="h-9 max-w-56"
          aria-label="New department name"
        />
        <select
          value={newParent}
          onChange={(e) => setNewParent(Number(e.target.value))}
          aria-label="Parent department"
          className="border-neutral-30 h-9 rounded-lg border bg-white px-2 text-sm"
        >
          <option value={ROOT}>No parent</option>
          {flat.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          size="sm"
          className="bg-[#3F576F] hover:bg-[#33485d]"
          disabled={!newName.trim() || createDepartment.isPending}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
