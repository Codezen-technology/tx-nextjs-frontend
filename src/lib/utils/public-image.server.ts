import fs from "node:fs";
import path from "node:path";

/** Returns true for absolute URLs (WP media) or root-relative paths that exist under `public/`. */
export function publicImageExists(src: string): boolean {
  if (src.startsWith("http://") || src.startsWith("https://")) return true;
  if (!src.startsWith("/")) return false;
  const filePath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  return fs.existsSync(filePath);
}
