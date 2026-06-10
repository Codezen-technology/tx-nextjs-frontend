"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  GraduationCap,
  IdCard,
  Infinity,
  Layers,
  Receipt,
  ScrollText,
  Tag,
  User,
} from "lucide-react";
import { useDashboardNav } from "@/lib/hooks/useStudentDashboard";
import { NAV_SLUG_ROUTES } from "@/lib/utils/student-dashboard";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "@/types/student-dashboard";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "my-learning": BookOpen,
  "all-courses": GraduationCap,
  "my-orders": Receipt,
  "my-certificate": Award,
  "my-transcript": ScrollText,
  "student-card": IdCard,
  "unlimited-learning": Infinity,
  "bundle-courses": Layers,
  "special-offers": Tag,
  "my-profile": User,
};

const DEFAULT_NAV: NavItem[] = [
  { slug: "my-learning", label: "My Learning", enabled: true },
  { slug: "all-courses", label: "All Courses", enabled: true },
  { slug: "my-orders", label: "My Orders", enabled: true },
];

interface DashboardNavProps {
  expanded: boolean;
  onNavigate?: () => void;
}

export function DashboardNav({ expanded, onNavigate }: DashboardNavProps) {
  const pathname = usePathname();
  const { data } = useDashboardNav();

  const items = data ? Object.values(data).filter((item) => item.enabled) : DEFAULT_NAV;

  const isActive = (slug: string) => {
    const route = NAV_SLUG_ROUTES[slug] ?? `/${slug}`;
    const base = route.split("?")[0];
    return pathname.endsWith(base) || pathname.includes(base);
  };

  return (
    <nav className="flex-1 overflow-y-auto pt-6">
      <ul className="space-y-1 px-2">
        {items.map((item) => {
          const Icon = ICON_MAP[item.slug] ?? BookOpen;
          const href = NAV_SLUG_ROUTES[item.slug] ?? `/${item.slug}`;
          const active = isActive(item.slug);

          return (
            <li key={item.slug}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center rounded-lg transition-colors",
                  expanded ? "mx-2 w-[calc(100%-1rem)] px-3" : "mx-auto w-12 justify-center",
                  active ? "bg-white/10" : "hover:bg-white/10",
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 shrink-0",
                    active ? "text-lms-secondary" : "text-white",
                    expanded && "mr-4",
                  )}
                />
                {expanded && <span className="text-sm capitalize text-white">{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
