import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const base = env.SITE_URL.replace(/\/$/, "") || "https://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Blocks crawling only. Indexing is blocked separately by the `robots`
        // metadata on each route group — a disallowed-but-linked URL can still
        // surface in results without it.
        disallow: [
          "/api/",
          "/business-dashboard/",
          "/cart",
          "/checkout",
          "/dashboard/",
          "/design-system",
          "/forgot-password",
          "/learn/",
          "/login",
          "/order-confirmation/",
          "/orders/",
          "/profile/",
          "/register",
          "/reset-password",
          "/search",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
