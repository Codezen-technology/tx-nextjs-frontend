"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddBusinessLearner } from "@/lib/hooks/useBusinessDashboard";
import {
  COLUMN_ROLES,
  COLUMN_ROLE_LABELS,
  EMAIL_REGEX,
  TEMPLATE_CSV,
  buildImportRows,
  defaultMapping,
  detectHeaderRow,
  mappingFromHeader,
  parseCsv,
  type ColumnRole,
  type ImportResultRow,
} from "@/lib/utils/business-csv";

const PREVIEW_ROWS = 5;

interface ParsedFile {
  name: string;
  rows: string[][];
  hasHeader: boolean;
}

/**
 * Bulk import from a spreadsheet.
 *
 * The upload is a client-side loop over `POST /team`, one request per row —
 * the same shape the legacy dashboard uses, and for the same reason: there is
 * no bulk endpoint yet (docs/B2B_API_GAPS.md cluster 6, `POST /team/bulk`).
 * Because of that, progress is reported per row and a failure never aborts the
 * remaining rows.
 */
export function CsvImportSection({ onDone }: { onDone?: () => void }) {
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnRole[]>([]);
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<ImportResultRow[] | null>(null);
  const [error, setError] = useState("");

  const addLearner = useAddBusinessLearner();

  /** Set false on unmount so an in-flight import stops queueing requests. */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const reset = () => {
    setFile(null);
    setMapping([]);
    setMappingConfirmed(false);
    setProgress(null);
    setResults(null);
    setError("");
  };

  const onFile = async (input: File | undefined) => {
    if (!input) return;
    setError("");
    setResults(null);
    setProgress(null);
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
    const collected: ImportResultRow[] = [];

    setResults(null);
    setProgress({ done: 0, total: records.length });

    for (let i = 0; i < records.length; i += 1) {
      if (!alive.current) return;

      const record = records[i];

      if (!EMAIL_REGEX.test(record.email)) {
        collected.push({
          row: i + 1,
          email: record.email || "(blank)",
          status: "skipped",
          message: "Not a valid email address",
        });
      } else {
        try {
          await addLearner.mutateAsync({
            email: record.email,
            first_name: record.first,
            last_name: record.last,
            role: "learner",
          });
          collected.push({ row: i + 1, email: record.email, status: "added" });
        } catch (err) {
          collected.push({
            row: i + 1,
            email: record.email,
            status: "skipped",
            message: err instanceof Error ? err.message : "Could not add this learner",
          });
        }
      }

      if (!alive.current) return;
      setProgress({ done: i + 1, total: records.length });
    }

    setResults(collected);
    setProgress(null);
    onDone?.();
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
              disabled={progress != null || dataRows.length === 0}
              onClick={() => (mappingConfirmed ? runImport() : setMappingConfirmed(true))}
            >
              {progress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding {progress.done} of {progress.total}…
                </>
              ) : mappingConfirmed ? (
                `Import ${dataRows.length} learners`
              ) : (
                "Check column mapping"
              )}
            </Button>
            <Button type="button" variant="outline" disabled={progress != null} onClick={reset}>
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
