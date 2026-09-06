"use client";

import { useMemo } from "react";
import { useMe } from "@/lib/hooks/useAuth";
import { BUSINESS_ROLES } from "@/components/business/business-access-guard";

/**
 * The `manage_b2b_*` capabilities the legacy dashboard gates its navigation on.
 * Names match the WordPress capability slugs so the mapping below can be
 * replaced wholesale once the backend exposes them.
 */
export type BusinessCapability =
  | "manage_b2b_dashboard"
  | "manage_b2b_learners"
  | "manage_b2b_courses"
  | "manage_b2b_analytics"
  | "manage_b2b_licences"
  | "manage_b2b_certificates"
  | "business_owner";

export type BusinessCapabilityMap = Record<BusinessCapability, boolean>;

/** Roles that own the business outright, as opposed to managing it. */
const OWNER_ROLES = ["administrator", "business_manager", "b2b_customer", "wplms_business"];

const ALL_CAPABILITIES: BusinessCapability[] = [
  "manage_b2b_dashboard",
  "manage_b2b_learners",
  "manage_b2b_courses",
  "manage_b2b_analytics",
  "manage_b2b_licences",
  "manage_b2b_certificates",
];

function emptyMap(): BusinessCapabilityMap {
  return {
    manage_b2b_dashboard: false,
    manage_b2b_learners: false,
    manage_b2b_courses: false,
    manage_b2b_analytics: false,
    manage_b2b_certificates: false,
    manage_b2b_licences: false,
    business_owner: false,
  };
}

/**
 * Capabilities for the signed-in user.
 *
 * Derived from WP roles rather than read from the API: `lms-b2b/v1` exposes
 * `GET /permissions/manager/capabilities?manager_id=` for reading *another*
 * manager's grants, but has no "my capabilities" route, and none is specified
 * in docs/B2B_API_GAPS.md. Gating the nav on roles is a stopgap for that gap,
 * not something the spec asked for. When a self-capabilities route exists,
 * swap the body of this hook for the query and every caller keeps working.
 *
 * Owners hold every capability. Managers hold the non-owner set; per-manager
 * revocations are not visible to the client until the endpoint exists, so this
 * is deliberately permissive — the server still enforces each request.
 */
export function useBusinessCapabilities() {
  const { data: user, isLoading } = useMe();
  const roles = user?.roles;

  const capabilities = useMemo<BusinessCapabilityMap>(() => {
    const map = emptyMap();
    if (!roles || roles.length === 0) return map;

    const isOwner = roles.some((r) => OWNER_ROLES.includes(r));
    const isManager = roles.some((r) => BUSINESS_ROLES.includes(r));

    if (!isOwner && !isManager) return map;

    for (const cap of ALL_CAPABILITIES) map[cap] = true;
    map.business_owner = isOwner;

    return map;
  }, [roles]);

  const can = useMemo(
    () => (capability?: BusinessCapability) => (capability ? capabilities[capability] : true),
    [capabilities],
  );

  return { capabilities, can, isOwner: capabilities.business_owner, isLoading };
}
