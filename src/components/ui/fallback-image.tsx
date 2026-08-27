"use client";

import { useState, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import { isRenderableImageSrc } from "@/lib/utils/image";

export interface FallbackImageProps extends Omit<ImageProps, "src"> {
  src: ImageProps["src"] | null | undefined;
  /** Image URL tried when `src` is unusable or fails to load. */
  fallbackSrc?: string;
  /** Rendered when every source above has been exhausted — e.g. a placeholder component. */
  fallback?: ReactNode;
}

/**
 * `next/image` that survives a dead `src`.
 *
 * Some CMS-managed image fields hold site-relative paths (`/images/foo.png`)
 * that point at frontend assets which were never added — the optimizer then
 * returns 400/404 and the layout is left with a blank reserved box, or worse a
 * collapsed one. Only the browser can tell a valid-looking URL from a dead one,
 * which is why this is a client component even on server-rendered pages.
 *
 * Resolution order: `src` → `fallbackSrc` → `fallback` node → nothing.
 * Each source is tried once. A source that errors advances to the next, so a
 * fallback that also fails degrades to absent instead of retrying forever.
 */
export function FallbackImage({ src, fallbackSrc, fallback, alt, ...props }: FallbackImageProps) {
  // Index into `sources`; once it runs past the end, the node fallback applies.
  const [attempt, setAttempt] = useState(0);

  const primary = isRenderableImageSrc(src) || typeof src === "object" ? src : undefined;
  const sources = [primary, fallbackSrc].filter(Boolean) as NonNullable<ImageProps["src"]>[];

  const current = sources[attempt];
  if (!current) return <>{fallback ?? null}</>;

  return (
    <Image
      // Remounting on source change resets next/image's internal load state, so
      // the fallback actually re-requests rather than reusing the failed one.
      key={typeof current === "string" ? current : `src-${attempt}`}
      src={current}
      alt={alt}
      onError={() => setAttempt((a) => a + 1)}
      {...props}
    />
  );
}
