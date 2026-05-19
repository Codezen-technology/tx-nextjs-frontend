import fs from "node:fs";
import path from "node:path";

/** Returns true when a file exists under `public/` for a root-relative path (e.g. `/images/foo.png`). */
export function publicImageExists(src: string): boolean {
  if (!src.startsWith("/")) return false;
  const filePath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  return fs.existsSync(filePath);
}
