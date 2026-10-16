import type { MetadataRoute } from "next";
import { dataUpdated, models } from "@/lib/data";
import { IS_DEMO } from "@/lib/mode";
import { isIndexable } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Demo builds are never indexed: empty sitemap.
  if (IS_DEMO) return [];
  return [
    { url: `${SITE.url}/`, lastModified: dataUpdated },
    { url: `${SITE.url}/despre-date/`, lastModified: dataUpdated },
    ...models
      .filter((m) => isIndexable(m) && m.price_eur)
      .map((m) => ({
        url: `${SITE.url}/masini/${m.id}/`,
        lastModified: m.price_eur!.collected_on,
      })),
  ];
}
