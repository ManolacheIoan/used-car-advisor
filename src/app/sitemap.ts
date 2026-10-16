import type { MetadataRoute } from "next";
import { dataUpdated, models } from "@/lib/data";
import { isIndexable } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, lastModified: dataUpdated },
    { url: `${SITE.url}/despre-date/`, lastModified: dataUpdated },
    ...models.filter(isIndexable).map((m) => ({
      url: `${SITE.url}/masini/${m.id}/`,
      lastModified: m.price_eur.set_on,
    })),
  ];
}
