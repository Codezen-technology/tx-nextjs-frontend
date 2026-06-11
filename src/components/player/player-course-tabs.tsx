"use client";

import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { PlayerSearchContent } from "@/components/player/player-search-content";
import { PlayerSidebarSections } from "@/components/player/player-sidebar-sections";
import { cn } from "@/lib/utils/cn";
import type { IPlayerUnit } from "@/types/player";

interface TabDef {
  label: ReactNode;
  content: ReactNode;
  mobileOnly?: boolean;
}

interface PlayerCourseTabsProps {
  items: IPlayerUnit[];
  courseId: number;
  activeUnitId: number;
  onCompleteUnit: (unitId: number) => void;
  markingUnitId: number | null;
}

function TabPanel({
  children,
  value,
  index,
}: {
  children: ReactNode;
  value: number;
  index: number;
}) {
  if (value !== index) return null;
  return (
    <div role="tabpanel" className="rounded-b-lg border-t border-gray-200 bg-white p-6">
      {children}
    </div>
  );
}

export function PlayerCourseTabs({
  items,
  courseId,
  activeUnitId,
  onCompleteUnit,
  markingUnitId,
}: PlayerCourseTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabDef[] = [
    {
      label: (
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
        </span>
      ),
      content: <PlayerSearchContent items={items} courseId={courseId} />,
    },
    {
      label: "Course content",
      mobileOnly: true,
      content: (
        <PlayerSidebarSections
          items={items}
          courseId={courseId}
          activeUnitId={activeUnitId}
          onCompleteUnit={onCompleteUnit}
          markingUnitId={markingUnitId}
        />
      ),
    },
    { label: "Overview", content: "Overview content" },
    { label: "Q&A", content: "Q&A content" },
    { label: "Notes", content: "Notes content" },
    { label: "Announcements", content: "Announcements content" },
    { label: "Reviews", content: "Reviews content" },
    { label: "Learning tools", content: "Learning tools content" },
  ];

  return (
    <div className="bg-white">
      <div className="flex overflow-x-auto border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={index}
            type="button"
            className={cn(
              "whitespace-nowrap bg-inherit px-6 py-3 text-sm font-medium transition-colors",
              activeTab === index
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:border-gray-300 hover:text-gray-700",
              tab.mobileOnly && "lg:hidden",
            )}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div key={index} className={tab.mobileOnly ? "lg:hidden" : ""}>
          <TabPanel value={activeTab} index={index}>
            {typeof tab.content === "string" ? (
              <p className="text-sm text-gray-600">{tab.content}</p>
            ) : (
              tab.content
            )}
          </TabPanel>
        </div>
      ))}
    </div>
  );
}
