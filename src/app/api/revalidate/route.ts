import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isKnownTag, MAX_TAGS_PER_REQUEST } from "@/lib/api/cache-tags";
import { env } from "@/lib/env";

/**
 * On-demand cache purge, called by WordPress when an editor saves.
 *
 * Every WordPress read in this app is cached by tag with a TTL of minutes to an
 * hour (`serverFetch` in `src/lib/api/server.ts`). Without this route the TTL is
 * the only way a content edit reaches visitors, which is how a floating-bar
 * notice switched on in WP Admin stayed invisible on production for an hour.
 * WordPress POSTs here with the tags its saved option maps to, and the next
 * request rebuilds from fresh data.
 *
 * The contract is in `API_REFERENCE.md`; `openspec/changes/add-settings-cache-revalidation/`
 * carries the reasoning.
 *
 * Node runtime because the auth check needs `node:crypto`'s `timingSafeEqual`.
 * `force-dynamic` because a cached purge endpoint is a purge that happens once.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET_HEADER = "x-wp-revalidate-secret";

/** Purging must not itself be cacheable, at any layer. */
const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate" } as const;

/**
 * One body for every rejected-caller case.
 *
 * An unconfigured deployment, a missing header, a wrong-length secret and a
 * wrong secret are indistinguishable from the outside on purpose — anything
 * more helpful tells someone probing the endpoint which half of their guess to
 * keep.
 */
function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE });
}

/**
 * Whether the caller presented the shared secret.
 *
 * Fails closed: a blank `WP_REVALIDATE_SECRET` rejects everyone rather than
 * accepting everyone. The naive `provided !== expected` check would let a
 * deployment that forgot the env var be purged by anyone sending an empty
 * header, and "the secret is missing" is exactly when nobody is watching.
 *
 * Lengths are compared before `timingSafeEqual` because it throws on a length
 * mismatch, and a throw that only happens for the wrong length is itself a
 * length oracle. The early return leaks the same fact in constant time and
 * without an exception path.
 */
function isAuthorized(req: Request): boolean {
  const expected = env.WP_REVALIDATE_SECRET;
  if (!expected) return false;

  const provided = req.headers.get(SECRET_HEADER);
  if (!provided) return false;

  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

interface RevalidateBody {
  tags?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!isAuthorized(req)) return unauthorized();

  const body = (await req.json().catch(() => null)) as RevalidateBody | null;
  if (!body || typeof body !== "object") {
    return badRequest("Expected a JSON body");
  }

  const { tags } = body;
  if (!Array.isArray(tags) || tags.length === 0) {
    return badRequest("Expected a non-empty `tags` array");
  }
  if (tags.length > MAX_TAGS_PER_REQUEST) {
    return badRequest(`At most ${MAX_TAGS_PER_REQUEST} tags per request`);
  }
  if (!tags.every((tag): tag is string => typeof tag === "string")) {
    return badRequest("Every tag must be a string");
  }

  // All-or-nothing. A partial purge would let a WP-side mapping bug hide behind
  // a 200: the tag that was spelled right refreshes, the other one never does,
  // and nobody looks again. Failing the whole request makes the typo loud on
  // the first save after it is introduced.
  const unknown = tags.find((tag) => !isKnownTag(tag));
  if (unknown !== undefined) {
    return badRequest(`Unknown cache tag: ${unknown}`);
  }

  // `{ expire: 0 }`, not the `"max"` the Next docs lead with: `"max"` keeps
  // serving stale content for up to a year while it revalidates behind the
  // scenes, so the editor who just pressed Save would still be looking at the
  // old page. `{ expire: 0 }` makes the next request block on fresh data, which
  // is the whole point of an on-demand purge. Next 16 requires the argument —
  // omitting it is deprecated and means the same thing.
  const unique = [...new Set(tags)];
  for (const tag of unique) revalidateTag(tag, { expire: 0 });

  return NextResponse.json(
    { revalidated: true, tags: unique, now: Date.now() },
    { headers: NO_STORE },
  );
}

/**
 * Anything but POST.
 *
 * Spelled out rather than left to 404 so a misconfigured hook — or a prefetch
 * that found this path — gets told the method is wrong instead of that the
 * endpoint does not exist.
 */
function methodNotAllowed(): NextResponse {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { ...NO_STORE, Allow: "POST" } },
  );
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
