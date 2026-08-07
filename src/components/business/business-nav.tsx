"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Layers,
  Package,
  Tag,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMe } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils/cn";

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  id: string;
  items: NavLink[];
}

const TOP_LINKS: NavLink[] = [
  { label: "Summary", href: "/business-dashboard", icon: LayoutDashboard },
  { label: "Learners", href: "/business-dashboard/learners", icon: Users },
  {
    label: "Assignment History",
    href: "/business-dashboard/learners/assignments",
    icon: ClipboardList,
  },
];

const COURSE_GROUP: NavGroup = {
  label: "Courses",
  icon: BookOpen,
  id: "courses",
  items: [
    { label: "Assign Courses", href: "/business-dashboard/courses/assign", icon: BookOpen },
    { label: "Assigned Courses", href: "/business-dashboard/courses", icon: Layers },
    { label: "Available Courses", href: "/business-dashboard/courses/available", icon: Package },
  ],
};

const BOTTOM_LINKS: NavLink[] = [
  { label: "Analytics & Reports", href: "/business-dashboard/analytics", icon: BarChart3 },
  { label: "Pricing", href: "/business-dashboard/pricing", icon: Tag },
  { label: "Licence History", href: "/business-dashboard/licences", icon: KeyRound },
  { label: "Order History", href: "/business-dashboard/orders", icon: CreditCard, ownerOnly: true },
  { label: "Certificates", href: "/business-dashboard/certificates", icon: Award },
  {
    label: "Subscriptions",
    href: "/business-dashboard/subscriptions",
    icon: CreditCard,
  },
  {
    label: "Business Management",
    href: "/business-dashboard/managers",
    icon: UserCog,
    ownerOnly: true,
  },
  { label: "Business Profile", href: "/business-dashboard/profile", icon: Building2 },
];

function isOwner(roles?: string[]) {
  return roles?.some((r) => ["administrator", "business_manager", "wplms_business"].includes(r));
}

function NavItem({
  item,
  expanded,
  active,
  onNavigate,
}: {
  item: NavLink;
  expanded: boolean;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-10 items-center rounded-lg transition-colors",
        expanded ? "px-3" : "justify-center",
        active ? "bg-[#F9A31A] text-white" : "text-white/90 hover:bg-white/10",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", expanded && "mr-3")} />
      {expanded && <span className="truncate text-sm font-medium">{item.label}</span>}
    </Link>
  );
}

interface BusinessNavProps {
  expanded: boolean;
  onNavigate?: () => void;
}

export function BusinessNav({ expanded, onNavigate }: BusinessNavProps) {
  const pathname = usePathname();
  const { data: user } = useMe();
  const owner = isOwner(user?.roles);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ courses: true });

  const allHrefs = [
    ...TOP_LINKS.map((i) => i.href),
    ...COURSE_GROUP.items.map((i) => i.href),
    ...BOTTOM_LINKS.map((i) => i.href),
  ];

  const activeHref = allHrefs.reduce<string>((best, href) => {
    const matches =
      pathname === href ||
      pathname.endsWith(href) ||
      (href !== "/business-dashboard" && pathname.includes(href));
    if (matches && href.length > best.length) return href;
    return best;
  }, "");

  const visibleBottom = BOTTOM_LINKS.filter((item) => {
    if (item.ownerOnly && !owner) return false;
    return true;
  });

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto py-4">
      <ul className="space-y-1 px-2">
        {TOP_LINKS.map((item) => (
          <li key={item.href}>
            <NavItem
              item={item}
              expanded={expanded}
              active={item.href === activeHref}
              onNavigate={onNavigate}
            />
          </li>
        ))}

        <li>
          {expanded ? (
            <button
              type="button"
              onClick={() => setOpenGroups((g) => ({ ...g, courses: !g.courses }))}
              className="flex min-h-10 w-full items-center rounded-lg px-3 text-white/90 hover:bg-white/10"
            >
              <COURSE_GROUP.icon className="mr-3 h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-left text-sm font-medium">
                {COURSE_GROUP.label}
              </span>
            </button>
          ) : null}
          {(expanded ? openGroups.courses : true) && (
            <ul className={cn("space-y-1", expanded && "mt-1 ml-2 border-l border-white/20 pl-2")}>
              {COURSE_GROUP.items.map((item) => (
                <li key={item.href}>
                  <NavItem
                    item={item}
                    expanded={expanded}
                    active={item.href === activeHref}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          )}
        </li>

        {visibleBottom.map((item) => (
          <li key={item.href}>
            <NavItem
              item={item}
              expanded={expanded}
              active={item.href === activeHref}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
