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
 *   5. Every row's Ref resolves to an item in docs/qa/QA_REPORT_ITEMS.md, or is NONE.
 *   6. Every item in that inventory is cited by at least one row.
 *
 * 5 and 6 exist because the report is a Google Doc this script cannot read. Three
 * times a page read `Open 0` while items sat untriaged — Homepage lost 5 rows,
 * Single Course lost 8. Assertion 6 is the one that catches that; assertion 5
 * catches its mirror image, a row invented by generalising another page's item.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const DOC_PATH = join(REPO_ROOT, "docs/qa/QA_BY_PAGE.md");
const ITEMS_PATH = join(REPO_ROOT, "docs/qa/QA_REPORT_ITEMS.md");

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
        // Columns: QA-ID | Ref | Quote | BP | Class | Status | Auto | Manual
        const refCell = cells[1] ?? "";
        const autoCell = cells[6] ?? "";
        // strip reclassification suffix e.g. "RECLASSIFIED → D" → "RECLASSIFIED"
        const status = (cells[5] ?? "").split("→")[0].trim();
        currentPage.issueRows.push({ qaId, refCell, autoCell, status });
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

      // Three forms, in order of preference:
      //   "e2e/design-fidelity.spec.ts > hero vertical inset..."  — anchored by test name
      //   "e2e/qa-round-1.spec.ts:37"                             — anchored by line
      //   "price.test.ts"                                          — file only
      //
      // Name anchoring exists because line anchoring drifts. Every slice that
      // adds a test above an existing one invalidates every ref below it — that
      // happened four times in one afternoon, and one stale ref was committed
      // before the checker caught it. A test's name survives insertions.
      const nameIdx = ref.indexOf(">");
      const hasName = nameIdx > 0;
      const testName = hasName ? ref.slice(nameIdx + 1).trim() : null;
      const refPath = hasName ? ref.slice(0, nameIdx).trim() : ref;

      const colonIdx = refPath.lastIndexOf(":");
      const hasLine = !hasName && colonIdx > 0 && /^\d+$/.test(refPath.slice(colonIdx + 1));
      const filePart = hasLine ? refPath.slice(0, colonIdx) : refPath;
      const lineNum = hasLine ? parseInt(refPath.slice(colonIdx + 1), 10) : null;

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

      if (testName !== null) {
        const source = readFileSync(resolvedPath, "utf8");
        // The declaring line, not any occurrence — a name that only appears in a
        // comment or an expect message would otherwise pass.
        const declared = source
          .split("\n")
          .some((l) => /\b(test|it)\(/.test(l) && l.includes(testName));
        if (!declared) {
          failures.push(
            `[${page.name}] ${qaId}: Auto ref "${ref}" — no test( or it( in ${filePart} declares "${testName}". Renamed or deleted?`,
          );
        }
      } else if (lineNum !== null) {
        const fileLines = readFileSync(resolvedPath, "utf8").split("\n");
        const targetLine = fileLines[lineNum - 1] ?? "";
        if (!/test\(|it\(/.test(targetLine)) {
          failures.push(
            `[${page.name}] ${qaId}: Auto ref "${ref}" — line ${lineNum} does not contain test( or it(. Found: "${targetLine.trim()}". Line refs drift when tests are inserted above them; prefer "${filePart} > <test name>"`,
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

  // ── Assertions 5 and 6: provenance, both directions ───────────────────────
  if (!existsSync(ITEMS_PATH)) {
    failures.push(
      `docs/qa/QA_REPORT_ITEMS.md not found — every row's Ref is unverifiable without it`,
    );
    return failures;
  }

  const itemsRaw = readFileSync(ITEMS_PATH, "utf8");
  // Item IDs are declared in the inventory's own tables as `R-PAGE-BP-NN`.
  const inventory = new Set(
    itemsRaw.match(/`(R-[A-Z]+-(?:1920|1280|440)-\d+)`/g)?.map((m) => m.slice(1, -1)) ?? [],
  );
  const cited = new Set();

  for (const page of pages) {
    for (const { qaId, refCell } of page.issueRows) {
      const refs = refCell.match(/R-[A-Z]+-(?:1920|1280|440)-\d+/g) ?? [];
      const isNone = /\bNONE\b/.test(refCell);

      if (!refs.length && !isNone) {
        failures.push(
          `[${page.name}] ${qaId}: Ref column is empty — every row cites a QA_REPORT_ITEMS.md item, or NONE with the reason in Manual`,
        );
        continue;
      }
      for (const ref of refs) {
        if (!inventory.has(ref)) {
          failures.push(
            `[${page.name}] ${qaId}: Ref "${ref}" is not in docs/qa/QA_REPORT_ITEMS.md. Renamed, or a typo?`,
          );
        } else {
          cited.add(ref);
        }
      }
    }
  }

  for (const item of inventory) {
    if (!cited.has(item)) {
      failures.push(
        `${item}: report item is cited by no row in QA_BY_PAGE.md. File it — with the status the code supports, not the one the report claims. An untriaged item is how a page reads "Open 0" while it is broken.`,
      );
    }
  }

  return failures;
}
