import type { StudentCourse } from "@/types/student-dashboard";

/** Prefer headless learn player over WP permalinks. */
export function getCourseContinueUrl(course: Pick<StudentCourse, "id" | "link">): string {
  return `/learn/${course.id}/start`;
}

export function isCourseComplete(userStatus: number): boolean {
  return userStatus === 2 || userStatus === 3;
}

export function getCourseCtaLabel(userStatus: number): string {
  return isCourseComplete(userStatus) ? "View Certificate" : "Resume";
}

export const ORDER_STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  completed: {
    bg: "rgba(0,188,125,0.1)",
    border: "rgba(0,188,125,0.2)",
    text: "#00bc7d",
  },
  processing: {
    bg: "rgba(22,194,213,0.1)",
    border: "rgba(22,194,213,0.2)",
    text: "#16c2d5",
  },
  "on-hold": {
    bg: "rgba(251,180,63,0.15)",
    border: "rgba(251,180,63,0.3)",
    text: "#d48a00",
  },
  default: {
    bg: "#f7f8f8",
    border: "#bec5c9",
    text: "#73828a",
  },
};

export function getOrderStatusStyle(status: string) {
  return ORDER_STATUS_STYLES[status.toLowerCase()] ?? ORDER_STATUS_STYLES.default;
}

/** Format a numeric amount with its ISO currency code (falls back gracefully). */
export function formatCurrency(amount: number, currency = "GBP"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Format an ISO date string for order rows. */
export function formatOrderDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Map navigation slug → dashboard route path. */
export const NAV_SLUG_ROUTES: Record<string, string> = {
  "my-learning": "/dashboard/my-learning",
  "all-courses": "/dashboard/all-courses",
  "my-orders": "/dashboard/my-orders",
  "my-certificate": "/dashboard/my-learning?tab=certificates",
  "my-transcript": "/dashboard/my-learning?tab=certificates",
  "student-card": "/dashboard/my-learning",
  "unlimited-learning": "/dashboard/subscription",
  "bundle-courses": "/dashboard/all-courses",
  "special-offers": "/dashboard/subscription",
  "my-profile": "/dashboard/profile",
};
