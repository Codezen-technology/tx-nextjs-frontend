"use client";

import { PlayerSectionHeader } from "@/components/player/player-section-header";
import { PlayerUnitItem } from "@/components/player/player-unit-item";
import { usePlayerSections } from "@/lib/hooks/usePlayerSections";
import type { IPlayerUnit } from "@/types/player";

interface PlayerSidebarSectionsProps {
  items: IPlayerUnit[];
  courseId: number;
  activeUnitId: number;
  onCompleteUnit: (unitId: number) => void;
  markingUnitId: number | null;
}

export function PlayerSidebarSections({
  items,
  courseId,
  activeUnitId,
  onCompleteUnit,
  markingUnitId,
}: PlayerSidebarSectionsProps) {
  const { sections, expandedSections, toggleSection, getSectionStats } = usePlayerSections(
    items,
    activeUnitId,
  );

  return (
    <div className="overflow-y-auto" id="custom-course-sections">
      {sections.map((section, index) => {
        const stats = getSectionStats(section);
        const isExpanded = expandedSections.includes(index);

        return (
          <div key={section.key} className="border border-gray-200 transition-colors">
            <PlayerSectionHeader
              title={section.title || "Section"}
              stats={stats}
              isExpanded={isExpanded}
              onClick={() => toggleSection(index)}
            />
            {isExpanded ? (
              <div className="border-t border-gray-200">
                {section.units.map((unit) => (
                  <PlayerUnitItem
                    key={unit.id}
                    unit={unit}
                    courseId={courseId}
                    isActive={unit.id === activeUnitId}
                    isMarkingComplete={markingUnitId === unit.id}
                    onCompleteUnit={onCompleteUnit}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
