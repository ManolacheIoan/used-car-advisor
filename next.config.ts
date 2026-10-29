import type { NextConfig } from "next";

/**
 * DATA_MODE=public|demo. Default: demo for `next dev`, public for production builds.
 * public → src/data/cars.public.json (verified rows only), output in out/ (the build Netlify deploys).
 * demo   → src/data/cars.demo.json (synthetic values, DEMO banner, noindex), output in out-demo/; used locally and
 *          for the GitHub Pages preview (.github/workflows/pages.yml), which keeps the banner and noindex.
 * SHOWCASE=1 (demo only) → same demo catalog without the DEMO labels, for local screenshots; output in
 * out-showcase/, still noindex, never deployed (audit:public checks out/ only).
 */
const mode =
  process.env.DATA_MODE ??
  (process.env.NODE_ENV === "production" ? "public" : "demo");
if (mode !== "public" && mode !== "demo")
  throw new Error(`DATA_MODE must be "public" or "demo", got "${mode}"`);
const demo = mode === "demo";
const showcase = process.env.SHOWCASE === "1";
if (showcase && !demo)
  throw new Error(
    "SHOWCASE=1 needs DATA_MODE=demo (it is never a public build)",
  );

/**
 * BASE_PATH: sub-path the site is served from, e.g. "/used-car-advisor" on GitHub Pages ("" = domain root).
 * SITE_URL: absolute site URL including that sub-path, used for canonical URLs, sitemap and Open Graph.
 */
const basePath = process.env.BASE_PATH ?? "";
if (!/^(\/[a-z0-9-]+)*$/.test(basePath))
  throw new Error(
    `BASE_PATH must look like "/name" or be empty, got "${basePath}"`,
  );
const siteUrl = process.env.SITE_URL ?? "";

const nextConfig: NextConfig = {
  output: "export",
  ...(demo ? { distDir: showcase ? "out-showcase" : "out-demo" } : {}),
  env: {
    NEXT_PUBLIC_DATA_MODE: mode,
    NEXT_PUBLIC_SHOWCASE: showcase ? "1" : "",
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  ...(basePath ? { basePath } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    ...(demo
      ? {
          resolveAlias: {
            "@/data/cars.public.json": "./src/data/cars.demo.json",
          },
        }
      : {}),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
