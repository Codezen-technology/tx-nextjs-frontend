"use client";

import { useState } from "react";
import { Download, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBulkImportLearners, useDepartments } from "@/lib/hooks/useBusinessDashboard";
import {
  COLUMN_ROLES,
  COLUMN_ROLE_LABELS,
  TEMPLATE_CSV,
  buildImportRows,
  defaultMapping,
  detectHeaderRow,
  mappingFromHeader,
  parseCsv,
  type ColumnRole,
} from "@/lib/utils/business-csv";
import type { BulkImportMember, BulkImportRowResult } from "@/types/business-dashboard";

const PREVIEW_ROWS = 5;
/** The backend rejects more than this in one request. */
const MAX_ROWS = 500;

interface ParsedFile {
  name: string;
  rows: string[][];
  hasHeader: boolean;
}

/**
 * Bulk import from a spreadsheet.
 *
 * One `POST /team/bulk` for the whole file, capped at 500 rows by the backend.
 * This replaced a per-row loop, which partially succeeded when a connection
 * dropped and could not report an honest total.
 *
 * Every row comes back with its own outcome. A row reported `added` may still
 * carry a `no_licence_available` code: the learner was created but their course
 * assignment failed, and calling that "skipped" would send a manager looking
 * for someone who is already on the team.
 */
export function CsvImportSection({ onDone }: { onDone?: () => void }) {
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnRole[]>([]);
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [results, setResults] = useState<BulkImportRowResult[] | null>(null);
  // Department names the spreadsheet used that match nothing in this business.
  // The API takes ids, so the backend never sees the name — reporting these is
  // the client's job, and staying silent would drop the column without a trace.
  const [unmatchedDepts, setUnmatchedDepts] = useState<{ name: string; count: number }[]>([]);
  const [error, setError] = useState("");

  const bulkImport = useBulkImportLearners();
  const { data: departments } = useDepartments();

  const reset = () => {
    setFile(null);
    setMapping([]);
    setMappingConfirmed(false);
    setResults(null);
    setUnmatchedDepts([]);
    setError("");
  };

  const onFile = async (input: File | undefined) => {
    if (!input) return;
    setError("");
    setResults(null);
    setMappingConfirmed(false);

    const rows = parseCsv(await input.text());

    if (rows.length === 0) {
      setError("That file has no rows.");
      setFile(null);
      return;
    }

    const hasHeader = detectHeaderRow(rows[0]);
    const width = Math.max(...rows.map((r) => r.length));

    setFile({ name: input.name, rows, hasHeader });
    setMapping(hasHeader ? mappingFromHeader(rows[0]) : defaultMapping(width));
  };

  const dataRows = file ? (file.hasHeader ? file.rows.slice(1) : file.rows) : [];

  const runImport = async () => {
    if (!file) return;

    const records = buildImportRows(dataRows, mapping);

    // Departments are matched by name, since a spreadsheet names them rather
    // than knowing their ids. The bulk API takes ids only, so an unmatched
    // name never reaches the backend — it is collected here and reported in
    // the results panel instead of being dropped silently.
    const byName = new Map(
      (departments?.flat ?? []).map((d) => [d.name.trim().toLowerCase(), d.id]),
    );
    const unmatched = new Map<string, number>();

    const members: BulkImportMember[] = records.map((record) => {
      const deptName = record.dept?.trim() ?? "";
      const departmentId = deptName ? byName.get(deptName.toLowerCase()) : undefined;
      if (deptName && !departmentId) {
        unmatched.set(deptName, (unmatched.get(deptName) ?? 0) + 1);
      }

      return {
        email: record.email,
        first_name: record.first,
        last_name: record.last,
        department_ids: departmentId ? [departmentId] : undefined,
      };
    });

    setResults(null);
    setUnmatchedDepts([...unmatched.entries()].map(([name, count]) => ({ name, count })));
    setError("");

    try {
      const result = await bulkImport.mutateAsync(members);
      setResults(result.results);
      onDone?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That import could not be sent. Please try again.",
      );
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "learner-import-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const added = results?.filter((r) => r.status === "added").length ?? 0;
  const skipped = results?.filter((r) => r.status === "skipped") ?? [];
  // Created, but their course assignment failed — worth calling out separately.
  const addedWithProblems = results?.filter((r) => r.status === "added" && r.code) ?? [];

  return (
    <div className="border-neutral-40 space-y-5 rounded-xl border bg-white p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-neutral-900">Import from a spreadsheet</h3>
          <p className="text-sm text-neutral-300">
            One learner per row: first name, last name, email address.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download template
        </Button>
      </div>

      <label className="border-neutral-30 hover:bg-neutral-10 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors">
        <FileUp className="h-6 w-6 text-neutral-300" />
        <span className="text-sm font-medium text-neutral-900">
          {file ? file.name : "Choose a CSV file"}
        </span>
        <span className="text-xs text-neutral-300">
          {file ? `${dataRows.length} learner rows detected` : "or drag one onto this box"}
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>

      {dataRows.length > MAX_ROWS ? (
        <p className="text-sm text-red-600">
          That file has {dataRows.length} rows. Import at most {MAX_ROWS} at a time.
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {file && !results ? (
        <>
          {mappingConfirmed ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-neutral-900">Match your columns</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {mapping.map((role, index) => (
                  <label key={index} className="text-sm">
                    <span className="text-neutral-300">
                      Column {index + 1}
                      {file.hasHeader && file.rows[0][index] ? ` · ${file.rows[0][index]}` : ""}
                    </span>
                    <select
                      value={role}
                      onChange={(e) => {
                        const next = [...mapping];
                        next[index] = e.target.value as ColumnRole;
                        setMapping(next);
                      }}
                      className="border-neutral-30 mt-1 h-9 w-full rounded-lg border bg-white px-2 text-sm"
                    >
                      {COLUMN_ROLES.map((option) => (
                        <option key={option} value={option}>
                          {COLUMN_ROLE_LABELS[option]}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-neutral-30 divide-y">
                {dataRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="py-1.5 pr-4 text-neutral-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {dataRows.length > PREVIEW_ROWS ? (
              <p className="mt-2 text-xs text-neutral-300">
                …and {dataRows.length - PREVIEW_ROWS} more rows
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              className="bg-[#3F576F] hover:bg-[#33485d]"
              disabled={bulkImport.isPending || dataRows.length === 0 || dataRows.length > MAX_ROWS}
              onClick={() => (mappingConfirmed ? runImport() : setMappingConfirmed(true))}
            >
              {bulkImport.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing {dataRows.length} learners…
                </>
              ) : mappingConfirmed ? (
                `Import ${dataRows.length} learners`
              ) : (
                "Check column mapping"
              )}
            </Button>
            <Button type="button" variant="outline" disabled={bulkImport.isPending} onClick={reset}>
              Cancel
            </Button>
          </div>
        </>
      ) : null}

      {results ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-900">
            Added {added} learner{added === 1 ? "" : "s"}
            {skipped.length > 0 ? `, skipped ${skipped.length}` : ""}.
          </p>

          {unmatchedDepts.length > 0 ? (
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">
                Some department names in the file match nothing in this business, so those learners
                were imported without a department.
              </p>
              <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-sm text-amber-900">
                {unmatchedDepts.map(({ name, count }) => (
                  <li key={name}>
                    “{name}” — {count} row{count === 1 ? "" : "s"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {addedWithProblems.length > 0 ? (
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">
                {addedWithProblems.length} learner
                {addedWithProblems.length === 1 ? " was" : "s were"} added, but their course
                assignment did not complete.
              </p>
              <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-sm text-amber-900">
                {addedWithProblems.map((row) => (
                  <li key={`added-${row.row}`}>
                    {row.email} — {row.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {skipped.length > 0 ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-neutral-700">
              {skipped.map((row) => (
                <li key={row.row}>
                  Row {row.row} · {row.email} — {row.message}
                </li>
              ))}
            </ul>
          ) : null}
          <Button type="button" variant="outline" onClick={reset}>
            Import another file
          </Button>
        </div>
      ) : null}
    </div>
  );
}
