import type { NextConfig } from "next";

/** E2E builds use a fictional, priced test catalog and a separate output folder; never deployed. */
const e2e = process.env.CATALOG === "e2e";

const nextConfig: NextConfig = {
  output: "export",
  ...(e2e ? { distDir: "out-e2e" } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    ...(e2e
      ? {
          resolveAlias: {
            "@/data/cars.json": "./tests/fixtures/cars.e2e.json",
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
