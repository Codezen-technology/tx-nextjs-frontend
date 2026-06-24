"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  Layers,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BusinessNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const BUSINESS_NAV: BusinessNavItem[] = [
  { label: "Summary", href: "/business-dashboard", icon: LayoutDashboard },
  { label: "Learners", href: "/business-dashboard/learners", icon: Users },
  {
    label: "Assignment History",
    href: "/business-dashboard/learners/assignments",
    icon: ClipboardList,
  },
  { label: "Assigned Courses", href: "/business-dashboard/courses", icon: BookOpen },
  { label: "Available Courses", href: "/business-dashboard/courses/available", icon: Layers },
  { label: "Analytics & Reports", href: "/business-dashboard/analytics", icon: BarChart3 },
  { label: "Licence History", href: "/business-dashboard/licences", icon: KeyRound },
  { label: "Certificates", href: "/business-dashboard/certificates", icon: Award },
  { label: "Business Profile", href: "/business-dashboard/profile", icon: Building2 },
];

interface BusinessNavProps {
  expanded: boolean;
  onNavigate?: () => void;
}

export function BusinessNav({ expanded, onNavigate }: BusinessNavProps) {
  const pathname = usePathname();

  // Active = the nav item whose href is the longest matching prefix of the path.
  const activeHref = BUSINESS_NAV.reduce<string>((best, item) => {
    const matches =
      pathname === item.href ||
      pathname.endsWith(item.href) ||
      pathname.includes(`${item.href}/`) ||
      pathname.includes(item.href);
    if (matches && item.href.length > best.length) return item.href;
    return best;
  }, "");

  return (
    <nav className="flex-1 overflow-y-auto py-4">
      <ul className="space-y-1 px-2">
        {BUSINESS_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.href === activeHref;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-12 items-center rounded-lg transition-colors",
                  expanded ? "px-3" : "justify-center",
                  active ? "bg-[#F9A31A] text-white" : "text-white/90 hover:bg-white/10",
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", expanded && "mr-3")} />
                {expanded && <span className="truncate text-sm font-medium">{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
