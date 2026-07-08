"use client";

import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { PlayerSectionHeader } from "@/components/player/player-section-header";
import { useCourseSearch } from "@/lib/hooks/useCourseSearch";
import { getSectionStats } from "@/lib/player/sections";
import { formatDuration } from "@/lib/utils/format";
import type { IPlayerUnit } from "@/types/player";

interface PlayerSearchContentProps {
  items: IPlayerUnit[];
  courseId: number;
}

export function PlayerSearchContent({ items, courseId }: PlayerSearchContentProps) {
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    isSearching,
    filteredSections,
    expandedSections,
    toggleSection,
    totalMatches,
  } = useCourseSearch(items);

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-4xl">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search course content"
            className="w-full rounded-md border border-gray-300 py-3 pr-24 pl-4 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
          <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-full bg-sky-100 p-1 hover:bg-gray-100"
                aria-label="Clear search"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            ) : null}
            <span className="rounded-full bg-sky-50 p-1">
              <Search className="h-5 w-5 text-gray-500" />
            </span>
          </div>
        </div>

        {debouncedSearchQuery ? (
          <div className="mt-4">
            {isSearching ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-900" />
                <p className="mt-2 text-gray-600">Searching…</p>
              </div>
            ) : filteredSections.length > 0 ? (
              <div className="space-y-4">
                <p className="mb-4 text-sm text-gray-600">
                  Results for &ldquo;{debouncedSearchQuery}&rdquo; ({totalMatches} matches)
                </p>
                {filteredSections.map((section, index) => (
                  <div key={section.key} className="rounded-lg border border-gray-200">
                    <PlayerSectionHeader
                      title={`${section.title} (${section.units.length} matches)`}
                      stats={getSectionStats(section)}
                      isExpanded={expandedSections.includes(index)}
                      onClick={() => toggleSection(index)}
                    />
                    {expandedSections.includes(index) ? (
                      <div className="border-t border-gray-200">
                        {section.units.map((unit) => (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => router.push(`/learn/${courseId}/${unit.id}`)}
                            className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {unit.icon ? <span className={unit.icon} /> : null}
                              <div>
                                <h4 className="font-medium">{unit.title}</h4>
                                {unit.duration ? (
                                  <p className="text-sm text-gray-600">
                                    {formatDuration(unit.duration)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <h3 className="mb-2 text-xl font-semibold text-gray-700">No results found</h3>
                <p className="text-gray-600">Try adjusting your search</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <h3 className="mb-2 text-xl font-semibold text-gray-700">Start a new search</h3>
            <p className="text-gray-600">Search transcripts, lectures or resources</p>
          </div>
        )}
      </div>
    </div>
  );
}
