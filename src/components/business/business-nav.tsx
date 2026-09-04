"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Layers,
  MessageSquareHeart,
  MoreHorizontal,
  Package,
  Search,
  Tag,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useBusinessCapabilities,
  type BusinessCapability,
} from "@/lib/hooks/useBusinessCapabilities";
import { cn } from "@/lib/utils/cn";

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  capability?: BusinessCapability;
}

interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  capability?: BusinessCapability;
  items: NavLink[];
}

type NavEntry = NavLink | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

/**
 * Mirrors the legacy dashboard's NAV_TREE so the two products read the same.
 * Order is meaningful: daily work at the top, billing and configuration below.
 */
const NAV_TREE: NavEntry[] = [
  {
    label: "Summary",
    href: "/business-dashboard",
    icon: LayoutDashboard,
    capability: "manage_b2b_dashboard",
  },
  {
    label: "Learners",
    href: "/business-dashboard/learners",
    icon: Users,
    capability: "manage_b2b_learners",
  },
  {
    label: "Search Courses",
    href: "/business-dashboard/courses/assign",
    icon: Search,
    capability: "manage_b2b_courses",
  },
  {
    id: "courses",
    label: "Courses",
    icon: BookOpen,
    capability: "manage_b2b_courses",
    items: [
      { label: "Available", href: "/business-dashboard/courses/available", icon: Package },
      { label: "Assigned", href: "/business-dashboard/courses", icon: Layers },
    ],
  },
  {
    label: "Certificates",
    href: "/business-dashboard/certificates",
    icon: Award,
    capability: "manage_b2b_certificates",
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    capability: "manage_b2b_analytics",
    items: [{ label: "Reports & Records", href: "/business-dashboard/analytics", icon: BarChart3 }],
  },
  {
    label: "Pricing",
    href: "/business-dashboard/pricing",
    icon: Tag,
    capability: "manage_b2b_licences",
  },
  {
    label: "Billing",
    href: "/business-dashboard/orders",
    icon: CreditCard,
    capability: "business_owner",
  },
  {
    id: "more",
    label: "More",
    icon: MoreHorizontal,
    capability: "manage_b2b_dashboard",
    items: [
      { label: "Business profile", href: "/business-dashboard/profile", icon: Building2 },
      { label: "Licence history", href: "/business-dashboard/licences", icon: KeyRound },
      { label: "Subscriptions", href: "/business-dashboard/subscriptions", icon: CreditCard },
      {
        label: "Managers",
        href: "/business-dashboard/managers",
        icon: UserCog,
        capability: "business_owner",
      },
      {
        label: "Assignment history",
        href: "/business-dashboard/learners/assignments",
        icon: ClipboardList,
      },
      { label: "Share feedback", href: "/business-dashboard/reviews", icon: MessageSquareHeart },
    ],
  },
];

/**
 * Strip a leading locale segment so active-link matching works on both `/foo`
 * and `/fr/foo`. next-intl uses `localePrefix: "as-needed"`, so English URLs
 * carry no prefix and non-English ones do.
 */
function stripLocale(pathname: string): string {
  const match = /^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/.exec(pathname);
  if (!match) return pathname || "/";
  const rest = pathname.slice(match[0].length);
  return rest || "/";
}

/**
 * The deepest nav href that prefixes the current path.
 *
 * A prefix match rather than `includes`, so `/business-dashboard/courses` does
 * not light up while the user is on `/business-dashboard/courses/available`
 * — the longest match wins and only one item is ever active.
 */
function resolveActiveHref(pathname: string, hrefs: string[]): string {
  const path = stripLocale(pathname);

  return hrefs.reduce<string>((best, href) => {
    const matches = path === href || path.startsWith(`${href}/`);
    return matches && href.length > best.length ? href : best;
  }, "");
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
      aria-current={active ? "page" : undefined}
      title={expanded ? undefined : item.label}
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
  const { can } = useBusinessCapabilities();

  const visible: NavEntry[] = NAV_TREE.filter((entry) => can(entry.capability)).map((entry) =>
    isGroup(entry) ? { ...entry, items: entry.items.filter((i) => can(i.capability)) } : entry,
  );

  const allHrefs = visible.flatMap((entry) =>
    isGroup(entry) ? entry.items.map((i) => i.href) : [entry.href],
  );
  const activeHref = resolveActiveHref(pathname, allHrefs);

  /** The group that owns the active route, so it reopens on navigation. */
  const owningGroupId = visible
    .filter(isGroup)
    .find((group) => group.items.some((i) => i.href === activeHref))?.id;

  const [openGroup, setOpenGroup] = useState<string | null>(owningGroupId ?? "courses");
  const [lastOwningGroupId, setLastOwningGroupId] = useState(owningGroupId);

  // Adjusting state during render rather than in an effect: navigating into a
  // collapsed group should reveal the active item on the same paint, not after
  // a second one. https://react.dev/learn/you-might-not-need-an-effect
  if (owningGroupId !== lastOwningGroupId) {
    setLastOwningGroupId(owningGroupId);
    if (owningGroupId) setOpenGroup(owningGroupId);
  }

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto py-4">
      <ul className="space-y-1 px-2">
        {visible.map((entry) => {
          if (!isGroup(entry)) {
            return (
              <li key={entry.href}>
                <NavItem
                  item={entry}
                  expanded={expanded}
                  active={entry.href === activeHref}
                  onNavigate={onNavigate}
                />
              </li>
            );
          }

          if (entry.items.length === 0) return null;

          // Collapsed rail has no room for a disclosure, so children always show.
          const open = expanded ? openGroup === entry.id : true;

          return (
            <li key={entry.id}>
              {expanded ? (
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenGroup(open ? null : entry.id)}
                  className="flex min-h-10 w-full items-center rounded-lg px-3 text-white/90 hover:bg-white/10"
                >
                  <entry.icon className="mr-3 h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-left text-sm font-medium">
                    {entry.label}
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 transition-transform", !open && "-rotate-90")}
                  />
                </button>
              ) : null}
              {open && (
                <ul
                  className={cn("space-y-1", expanded && "mt-1 ml-2 border-l border-white/20 pl-2")}
                >
                  {entry.items.map((item) => (
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
          );
        })}
      </ul>
    </nav>
  );
}
