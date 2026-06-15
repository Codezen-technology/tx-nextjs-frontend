import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const base = env.SITE_URL.replace(/\/$/, "") || "https://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/learn/",
          "/profile/",
          "/orders/",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/search",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
