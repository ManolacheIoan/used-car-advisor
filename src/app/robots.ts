import type { MetadataRoute } from "next";
import { IS_DEMO } from "@/lib/mode";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (IS_DEMO) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/rezultate/", "/compara/", "/favorite/", "/offline/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
