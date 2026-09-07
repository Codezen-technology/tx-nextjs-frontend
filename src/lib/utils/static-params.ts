/**
 * Sentinel slug used to keep `generateStaticParams` from returning an empty array.
 *
 * Next.js 16.2.9 breaks the `dynamicParams` on-demand fallback for *every*
 * unlisted slug (500, digest DYNAMIC_SERVER_USAGE) whenever a dynamic segment's
 * `generateStaticParams` returns a genuinely empty array. Emitting one sentinel
 * keeps the array non-empty without pre-rendering anything real; `sanitize_title`
 * on the WordPress side means no actual slug can ever collide with it.
 *
 * Pages must short-circuit to `notFound()` on this slug *before* fetching, so the
 * build does not log a spurious 404 for it.
 */
export const STATIC_PARAMS_PLACEHOLDER = "__lms_static_params_placeholder__";

export function isStaticParamsPlaceholder(slug: string): boolean {
  return slug === STATIC_PARAMS_PLACEHOLDER;
}

/** Returns `params`, or a single sentinel entry when the list is empty. */
export function withStaticParamsPlaceholder(params: { slug: string }[]): { slug: string }[] {
  return params.length > 0 ? params : [{ slug: STATIC_PARAMS_PLACEHOLDER }];
}
