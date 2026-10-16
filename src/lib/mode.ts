/** Set at build time by next.config.ts. Anything other than "demo" is treated as public. */
export const DATA_MODE: "public" | "demo" =
  process.env.NEXT_PUBLIC_DATA_MODE === "demo" ? "demo" : "public";
export const IS_DEMO = DATA_MODE === "demo";
export const DEMO_BANNER = "DEMO: valori fictive, nu pentru decizii reale";
