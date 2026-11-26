import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const allow = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
  return allow
    ? { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/account", "/saved", "/messages", "/admin", "/dashboard"] }], sitemap: `${siteUrl}/sitemap.xml` }
    : { rules: [{ userAgent: "*", disallow: "/" }] }; // staging/demo: never indexed
}
