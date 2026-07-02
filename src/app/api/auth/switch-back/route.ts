import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  clearImpersonationCookies,
  normalizeAuthUser,
  setSessionCookies,
} from "@/lib/api/auth-cookies";
import { endpoints } from "@/lib/api/endpoints";
import { sanitizeWpErrorMessage } from "@/lib/api/error";
import { getServerWpJsonBase } from "@/lib/env";

export async function POST() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;
  const origAccess = cookieStore.get("orig_access_token")?.value;
  const origRefresh = cookieStore.get("orig_refresh_token")?.value;

  if (!access && !origAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = getServerWpJsonBase();
  let wpUser: Record<string, unknown> | undefined;

  if (base && access) {
    try {
      const wpRes = await fetch(`${base}${endpoints.auth.switchBack}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
      });
      const json = (await wpRes.json()) as {
        success?: boolean;
        data?: {
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
          user?: Record<string, unknown>;
        };
        message?: string;
      };

      if (wpRes.ok && json.success && json.data?.user) {
        wpUser = json.data.user;
      } else if (!origAccess) {
        return NextResponse.json(
          { error: sanitizeWpErrorMessage(json.message, "Could not switch back.") },
          { status: wpRes.ok ? 400 : wpRes.status },
        );
      }
    } catch {
      if (!origAccess) {
        return NextResponse.json({ error: "Switch back service unavailable" }, { status: 502 });
      }
    }
  }

  if (origAccess) {
    setSessionCookies(cookieStore, {
      access_token: origAccess,
      refresh_token: origRefresh,
      expires_in: 86400,
    });
    clearImpersonationCookies(cookieStore);
    return NextResponse.json({ user: normalizeAuthUser(wpUser) });
  }

  return NextResponse.json({ error: "No admin session to restore" }, { status: 400 });
}
