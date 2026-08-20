import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/invite/", "/reset-password"],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
