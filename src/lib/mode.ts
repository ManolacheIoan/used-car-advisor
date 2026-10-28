/** Set at build time by next.config.ts. Anything other than "demo" is treated as public. */
export const DATA_MODE: "public" | "demo" =
  process.env.NEXT_PUBLIC_DATA_MODE === "demo" ? "demo" : "public";
export const IS_DEMO = DATA_MODE === "demo";
/** Local screenshot build: demo catalog, DEMO labels hidden. Only possible with DATA_MODE=demo (next.config.ts). */
export const IS_SHOWCASE = IS_DEMO && process.env.NEXT_PUBLIC_SHOWCASE === "1";
/** Source titles without the DEMO wording in showcase builds. */
export const shownSourceTitle = (t: string) =>
  IS_SHOWCASE && /DEMO/.test(t)
    ? "Valori ilustrative (formulă deterministă)"
    : t;
/** Source/licence text without "(doar DEMO)"-style qualifiers in showcase builds. */
export const shownText = (t: string) =>
  IS_SHOWCASE ? t.replace(/\s*\((?:doar|vizibilă doar în) DEMO\)/g, "") : t;
export const DEMO_BANNER = "DEMO: valori fictive, nu pentru decizii reale";
