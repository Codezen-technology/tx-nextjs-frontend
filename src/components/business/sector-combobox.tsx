"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

/**
 * Type-ahead over the sector vocabulary the backend serves.
 *
 * Nearly 300 entries is too many for a select and too specific for free text —
 * the column the answer lands in is grouped on by the admin reports, so
 * accepting anything typed would turn that report into a list of near-duplicate
 * spellings. So: type to filter, but only a listed entry counts.
 *
 * The committed value is held by the parent; `draft` is what is in the box
 * while someone is still typing. Typing clears the commitment, which keeps
 * half-typed text from reading as an answer.
 */
export function SectorCombobox({
  value,
  onChange,
  onDraftChange,
  sectors,
  isLoading = false,
  isUnavailable = false,
  id = "company-sector",
}: {
  value: string;
  onChange: (sector: string) => void;
  /**
   * The raw text in the box, which is not the same as the answer.
   * A caller that can save needs both: text with no committed value means
   * "half-typed", which must not be read as "cleared".
   */
  onDraftChange?: (draft: string) => void;
  sectors: readonly string[];
  isLoading?: boolean;
  /** The vocabulary could not be fetched — say so rather than showing an empty list. */
  isUnavailable?: boolean;
  id?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const blurTimer = useRef<number | undefined>(undefined);

  // The deferred close below outlives the component if it unmounts mid-blur.
  useEffect(() => () => window.clearTimeout(blurTimer.current), []);

  const matches = useMemo(() => {
    const query = draft.trim().toLowerCase();
    if (!query) return sectors;
    return sectors.filter((sector) => sector.toLowerCase().includes(query));
  }, [draft, sectors]);

  const commit = (sector: string) => {
    setDraft(sector);
    onDraftChange?.(sector);
    setOpen(false);
    setHighlighted(-1);
    onChange(sector);
  };

  const move = (delta: number) => {
    if (!matches.length) return;
    const next = Math.min(Math.max(highlighted + delta, 0), matches.length - 1);
    setHighlighted(next);
    // Keep the highlighted row in view — arrowing past the edge of a scrolling
    // list with nothing moving reads as the keys not working.
    (listRef.current?.children[next] as HTMLElement | undefined)?.scrollIntoView({
      block: "nearest",
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      move(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Enter" && open && highlighted >= 0 && matches[highlighted]) {
      event.preventDefault();
      commit(matches[highlighted]);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      if (!open || !matches.length) return;
      event.preventDefault();
      move(event.key === "Home" ? -matches.length : matches.length);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  const listId = `${id}-list`;

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open && !isLoading && !isUnavailable}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
        aria-busy={isLoading || undefined}
        aria-describedby={isUnavailable ? `${id}-unavailable` : undefined}
        autoComplete="off"
        // readOnly rather than disabled: a disabled input leaves the tab order,
        // which would put the only explanation of why it is unusable out of
        // reach of the people most likely to need it.
        readOnly={isUnavailable}
        aria-disabled={isUnavailable || undefined}
        disabled={isLoading}
        placeholder={
          isLoading ? "Loading sectors…" : isUnavailable ? "Unavailable" : "Select or type a sector"
        }
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          onDraftChange?.(e.target.value);
          setOpen(true);
          setHighlighted(-1);
          // Typing over a chosen sector un-chooses it: the field now shows
          // something that is not yet an answer.
          onChange("");
        }}
        onFocus={() => setOpen(true)}
        // Deferred so a click on an option lands before the list closes.
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
      />

      {isLoading ? (
        <Loader2
          aria-hidden="true"
          className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-300"
        />
      ) : null}

      {isUnavailable ? (
        <p id={`${id}-unavailable`} className="mt-1.5 text-xs text-neutral-300">
          The sector list could not be loaded, so this can be left blank for now and set later in
          Settings.
        </p>
      ) : null}

      {open && !isLoading && !isUnavailable ? (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label="Sectors"
          className="border-neutral-30 absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-[228px] overflow-auto rounded-lg border bg-white shadow-xl"
        >
          {matches.length ? (
            matches.map((sector, index) => (
              <li
                key={sector}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={sector === value}
                onMouseDown={() => commit(sector)}
                onMouseEnter={() => setHighlighted(index)}
                className={cn(
                  "cursor-pointer px-3.5 py-2 text-sm text-neutral-900",
                  index === highlighted && "bg-[#3F576F]/10",
                )}
              >
                {sector}
              </li>
            ))
          ) : (
            <li role="presentation" className="px-3.5 py-2.5 text-sm text-neutral-300">
              No matches
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
