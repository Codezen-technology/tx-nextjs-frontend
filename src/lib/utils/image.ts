/** True when `src` is safe for `next/image` (remote URL or site-relative path). */
export function isRenderableImageSrc(src: unknown): src is string {
  if (typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  return (
    /^https?:\/\//i.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("data:image/")
  );
}
