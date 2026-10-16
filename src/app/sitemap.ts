import type { MetadataRoute } from "next";
import { dataUpdated, models } from "@/lib/data";
import { visibleGuides } from "@/lib/guides";
import { IS_DEMO } from "@/lib/mode";
import { isIndexable } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { groupByBrand } from "@/lib/taxonomy";

export const dynamic = "force-static";

const STATIC_PAGES = [
  "/",
  "/catalog/",
  "/marci/",
  "/instrumente/",
  "/calculator-cost/",
  "/calculator-finantare/",
  "/buget/",
  "/ghiduri/",
  "/metodologie/",
  "/despre-date/",
  "/surse/",
  "/contact/",
  "/confidentialitate/",
  "/termeni/",
  "/politica-continut-sponsorizat/",
];

/** Only verified, non-demo models with a price; only published guides. Demo builds: empty. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (IS_DEMO) return [];
  const indexable = models.filter((m) => isIndexable(m) && m.price_eur);
  const url = (p: string) => `${SITE.url}${p}`;
  const brands = groupByBrand(indexable);
  const published = visibleGuides();
  return [
    ...STATIC_PAGES.map((p) => ({ url: url(p), lastModified: dataUpdated })),
    ...brands.map((b) => ({
      url: url(`/marci/${b.id}/`),
      lastModified: dataUpdated,
    })),
    ...brands.flatMap((b) =>
      b.lines.map((l) => ({
        url: url(`/marci/${b.id}/${l.slug}/`),
        lastModified: dataUpdated,
      })),
    ),
    ...indexable.map((m) => ({
      url: url(`/masini/${m.id}/`),
      lastModified: m.price_eur!.collected_on,
    })),
    ...published
      .filter((g) => g.category === "ghid")
      .map((g) => ({
        url: url(`/ghiduri/${g.slug}/`),
        lastModified: g.reviewed,
      })),
    ...published
      .filter((g) => g.slug === "glosar" || g.slug === "intrebari-frecvente")
      .map((g) => ({ url: url(`/${g.slug}/`), lastModified: g.reviewed })),
  ];
}
