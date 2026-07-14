import {
  Clock,
  ShieldCheck,
  GraduationCap,
  FileCheck,
  UserRound,
  Monitor,
  Smartphone,
  ClipboardCheck,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";

/** lucide-react icon name (as returned by the API) -> component. */
const ICON_MAP: Record<string, LucideIcon> = {
  clock: Clock,
  "shield-check": ShieldCheck,
  "graduation-cap": GraduationCap,
  "file-check": FileCheck,
  "user-round": UserRound,
  monitor: Monitor,
  smartphone: Smartphone,
  "clipboard-check": ClipboardCheck,
};

interface HomeIconProps {
  name: string;
  className?: string;
}

/** Resolves a CMS-provided lucide icon name to its component, falling back to a generic checkmark. */
export function HomeIcon({ name, className }: HomeIconProps) {
  const Icon = ICON_MAP[name] ?? CircleCheck;
  return <Icon className={className} aria-hidden="true" />;
}
