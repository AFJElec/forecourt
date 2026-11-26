import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { dealers, listings, taxonomy } from "@/lib/repositories";

/** XML sitemap. At scale, split with generateSitemaps() (50k URLs per file). Demo listings are excluded. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [makes, models, dealerList, all] = await Promise.all([
    taxonomy().manufacturers(), taxonomy().models(), dealers().list(), listings().search({ page: 1 }),
  ]);
  const now = new Date();
  const staticUrls = ["", "/used-cars", "/dealers", "/help/safety", "/about"].map((p) => ({ url: `${siteUrl}${p}`, lastModified: now }));
  const makeUrls = makes.map((m) => ({ url: `${siteUrl}/used-cars/${m.slug}`, lastModified: now, changeFrequency: "daily" as const }));
  const modelUrls = models.map((m) => {
    const make = makes.find((x) => x.id === m.manufacturerId)!;
    return { url: `${siteUrl}/used-cars/${make.slug}/${m.slug}`, lastModified: now, changeFrequency: "daily" as const };
  });
  const dealerUrls = dealerList.map((d) => ({ url: `${siteUrl}/dealers/${d.slug}`, lastModified: now }));
  const vehicleUrls = all.items.filter((v) => !v.isDemo).map((v) => ({ url: `${siteUrl}/vehicle/${v.slug}`, lastModified: new Date(v.listedAt) }));
  return [...staticUrls, ...makeUrls, ...modelUrls, ...dealerUrls, ...vehicleUrls];
}
