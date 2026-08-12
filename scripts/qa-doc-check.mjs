/**
 * Structural integrity checker for docs/qa/QA_BY_PAGE.md.
 *
 * Assertions:
 *   1. Every Auto test reference (file:line or bare file) resolves on disk,
 *      and a file:line reference's line contains `test(` or `it(`.
 *   2. No row carries both GAP and MANUAL-VISUAL in its Auto cell.
 *   3. Every GAP row appears in that page's "Tests to write" section,
 *      and every "Tests to write" entry has a matching GAP row.
 *   4. Page-index Open and Blocked counts match actual row counts.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const DOC_PATH = join(REPO_ROOT, "docs/qa/QA_BY_PAGE.md");

export function runChecks() {
  if (!existsSync(DOC_PATH)) {
    throw new Error(`docs/qa/QA_BY_PAGE.md not found at ${DOC_PATH}`);
  }

  const raw = readFileSync(DOC_PATH, "utf8");
  const lines = raw.split("\n");

  const failures = [];

  // ── Parse page index ──────────────────────────────────────────────────────
  // Lines like: | Homepage | `/` | RED | 6 | 2 | `qa-class-a-design-fidelity §5.2` |
  const indexMap = {}; // pageName → { open: number, blocked: number }
  let inIndex = false;
  for (const line of lines) {
    if (/^## Page Index/.test(line)) {
      inIndex = true;
      continue;
    }
    if (inIndex && /^## /.test(line)) {
      inIndex = false;
    }
    if (!inIndex) continue;
    const m = line.match(
      /^\|\s*([^|]+?)\s*\|\s*[^|]+\s*\|\s*(RED|AMBER|GREEN)[^|]*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/,
    );
    if (m) {
      const name = m[1].trim();
      if (name !== "Page") {
        indexMap[name] = { open: parseInt(m[3], 10), blocked: parseInt(m[4], 10) };
      }
    }
  }

  // ── Parse page sections ───────────────────────────────────────────────────
  const pages = []; // { name, issueRows, gapIds, testsToWriteIds }
  let currentPage = null;
  let inIssueTable = false;
  let inTestsToWrite = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect page section heading (### PageName)
    const pageHeading = line.match(/^### (.+)$/);
    if (pageHeading) {
      const name = pageHeading[1].trim();
      // Skip sub-headings inside a page (Manual sweep, Issue table, etc.)
      const knownSub = /^(Manual sweep|Issue table|Tests to write|Metadata|Notes)$/i.test(name);
      if (!knownSub) {
        currentPage = { name, issueRows: [], gapIds: [], testsToWriteIds: [] };
        pages.push(currentPage);
        inIssueTable = false;
        inTestsToWrite = false;
      }
      continue;
    }

    if (!currentPage) continue;

    // Detect section transitions within a page
    if (/^#### Issue table/.test(line)) {
      inIssueTable = true;
      inTestsToWrite = false;
      continue;
    }
    if (/^#### Tests to write/.test(line)) {
      inTestsToWrite = true;
      inIssueTable = false;
      continue;
    }
    if (/^####/.test(line)) {
      inIssueTable = false;
      inTestsToWrite = false;
      continue;
    }
    if (/^---/.test(line)) {
      inIssueTable = false;
      inTestsToWrite = false;
    }

    // Parse issue table rows
    // | QA-HOME-B1 | "..." | all | B | FIXED | `e2e/qa-round-1.spec.ts:37` | — |
    if (inIssueTable && line.startsWith("|")) {
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cells.length >= 6 && cells[0].match(/^QA-[A-Z]+-\w+/)) {
        const qaId = cells[0];
        const autoCell = cells[5] ?? "";
        // strip reclassification suffix e.g. "RECLASSIFIED → D" → "RECLASSIFIED"
        const status = (cells[4] ?? "").split("→")[0].trim();
        currentPage.issueRows.push({ qaId, autoCell, status });
        if (/\bGAP\b/.test(autoCell)) {
          currentPage.gapIds.push(qaId);
        }
      }
    }

    // Parse "Tests to write" entries
    // - `QA-HOME-A3` — assert ...
    if (inTestsToWrite && line.startsWith("-")) {
      const m = line.match(/`(QA-[A-Z]+-[A-Z0-9]+)`/);
      if (m) currentPage.testsToWriteIds.push(m[1]);
    }
  }

  // ── Assertion 1: test reference resolution ────────────────────────────────
  for (const page of pages) {
    for (const { qaId, autoCell } of page.issueRows) {
      // Extract file:line or bare file from backtick-wrapped values
      const refMatch = autoCell.match(/`([^`]+)`/);
      if (!refMatch) continue;
      const ref = refMatch[1].trim();
      if (["GAP", "MANUAL-VISUAL", "N/A"].includes(ref)) continue;

      // Could be "e2e/qa-round-1.spec.ts:37" or "price.test.ts"
      const colonIdx = ref.lastIndexOf(":");
      const hasLine = colonIdx > 0 && /^\d+$/.test(ref.slice(colonIdx + 1));
      const filePart = hasLine ? ref.slice(0, colonIdx) : ref;
      const lineNum = hasLine ? parseInt(ref.slice(colonIdx + 1), 10) : null;

      // Resolve relative to repo root or src/__tests__ or e2e
      const candidates = [
        join(REPO_ROOT, filePart),
        join(REPO_ROOT, "src/__tests__", filePart),
        join(REPO_ROOT, "e2e", filePart),
        join(REPO_ROOT, "src", filePart),
      ];
      const resolvedPath = candidates.find(existsSync);

      if (!resolvedPath) {
        failures.push(
          `[${page.name}] ${qaId}: Auto ref "${ref}" — file not found. Tried: ${candidates.map((c) => c.replace(REPO_ROOT + "/", "")).join(", ")}`,
        );
        continue;
      }

      if (lineNum !== null) {
        const fileLines = readFileSync(resolvedPath, "utf8").split("\n");
        const targetLine = fileLines[lineNum - 1] ?? "";
        if (!/test\(|it\(/.test(targetLine)) {
          failures.push(
            `[${page.name}] ${qaId}: Auto ref "${ref}" — line ${lineNum} does not contain test( or it(. Found: "${targetLine.trim()}"`,
          );
        }
      }
    }
  }

  // ── Assertion 2: GAP ∩ MANUAL-VISUAL invariant ───────────────────────────
  for (const page of pages) {
    for (const { qaId, autoCell } of page.issueRows) {
      if (/\bGAP\b/.test(autoCell) && /\bMANUAL-VISUAL\b/.test(autoCell)) {
        failures.push(
          `[${page.name}] ${qaId}: Auto cell contains both GAP and MANUAL-VISUAL — "${autoCell}"`,
        );
      }
    }
  }

  // ── Assertion 3: GAP ↔ tests-to-write parity ─────────────────────────────
  for (const page of pages) {
    // Every GAP row must appear in tests to write
    for (const id of page.gapIds) {
      if (!page.testsToWriteIds.includes(id)) {
        failures.push(
          `[${page.name}] ${id}: has Auto=GAP but is missing from "Tests to write" section`,
        );
      }
    }
    // Every tests-to-write entry must match a GAP row
    for (const id of page.testsToWriteIds) {
      if (!page.gapIds.includes(id)) {
        failures.push(
          `[${page.name}] ${id}: appears in "Tests to write" but has no Auto=GAP row in the issue table`,
        );
      }
    }
  }

  // ── Assertion 4: page-index count accuracy ────────────────────────────────
  for (const page of pages) {
    const indexEntry = indexMap[page.name];
    if (!indexEntry) continue;

    // Open = shippable work remains; Blocked = BLOCKED-DESIGN.
    // PARTIAL-FIX counts as open: one aspect of the row shipped and another did
    // not, so the row still owes work. Counting it as closed would let a page
    // read GREEN while a measured target is still unapplied.
    const OPEN_STATUSES = new Set(["STILL-BROKEN", "PARTIAL-FIX"]);
    const shippableOpenRows = page.issueRows.filter((r) => OPEN_STATUSES.has(r.status));
    const blockedRows = page.issueRows.filter((r) => r.status === "BLOCKED-DESIGN");

    if (shippableOpenRows.length !== indexEntry.open) {
      const ids = shippableOpenRows.map((r) => r.qaId).join(", ");
      failures.push(
        `[${page.name}] page-index Open count: expected ${indexEntry.open}, found ${shippableOpenRows.length}` +
          (ids ? ` (open rows: ${ids})` : ""),
      );
    }
    if (blockedRows.length !== indexEntry.blocked) {
      const ids = blockedRows.map((r) => r.qaId).join(", ");
      failures.push(
        `[${page.name}] page-index Blocked count: expected ${indexEntry.blocked}, found ${blockedRows.length}` +
          (ids ? ` (blocked rows: ${ids})` : ""),
      );
    }
  }

  return failures;
}
