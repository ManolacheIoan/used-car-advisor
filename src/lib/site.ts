export const SITE = {
  name: "AlegeMasina",
  title: "Alege mașina potrivită",
  description:
    "Răspunde la câteva întrebări și vezi modele de mașini second-hand populare în România, cu scor, motive și cost lunar orientativ.",
  // Set with SITE_URL at build time (next.config.ts); the default is a placeholder until a domain exists.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://alegemasina.netlify.app",
  contactEmail: "contact@manotek.ro",
} as const;

/** Sub-path the site is served from ("" at the domain root, "/used-car-advisor" on GitHub Pages). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixes a root-relative path with BASE_PATH, for URLs that next/link does not handle (images, manifest, SW). */
export const withBase = (p: string) => `${BASE_PATH}${p}`;
