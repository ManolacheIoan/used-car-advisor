import type { NextConfig } from "next";

/**
 * DATA_MODE=public|demo. Default: demo for `next dev`, public for production builds.
 * public → src/data/cars.public.json (verified rows only), output in out/ (the only folder ever deployed).
 * demo   → src/data/cars.demo.json (synthetic values, banner, noindex), output in out-demo/; local use only.
 */
const mode =
  process.env.DATA_MODE ??
  (process.env.NODE_ENV === "production" ? "public" : "demo");
if (mode !== "public" && mode !== "demo")
  throw new Error(`DATA_MODE must be "public" or "demo", got "${mode}"`);
const demo = mode === "demo";

const nextConfig: NextConfig = {
  output: "export",
  ...(demo ? { distDir: "out-demo" } : {}),
  env: { NEXT_PUBLIC_DATA_MODE: mode },
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
