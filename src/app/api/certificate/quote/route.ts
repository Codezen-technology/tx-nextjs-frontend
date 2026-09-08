import type { NextRequest } from "next/server";
import { proxyToWP } from "@/lib/api/bff";

/**
 * Server-authoritative quote for a certificate selection.
 *
 * Same reason as `/api/certificate/config` — the browser cannot reach the WP
 * REST API cross-origin (SiteGround captcha, no CORS headers).
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as unknown;
  return proxyToWP("/certificate/quote", { method: "POST", body, requiresAuth: false });
}
