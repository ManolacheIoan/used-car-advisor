/** "Who it suits": the transparent usage rules applied to the model's cheapest-to-run engine. */
import { DEFAULT_ASSUMPTIONS } from "./cost";
import { USAGE_LABEL } from "./labels";
import { pickEngine, usageFit, type Reason } from "./scoring";
import type { CarModel, Usage } from "./types";

export const SUITS_THRESHOLD = 0.7;

/** [] when the model has no engine the rules can be applied to (e.g. hybrid/electric only). */
export function suitability(m: CarModel, kmYear = 12000) {
  const picked = pickEngine(m, "oricare", kmYear, DEFAULT_ASSUMPTIONS);
  if (!picked) return [];
  const { engine } = picked;
  return (Object.keys(USAGE_LABEL) as Usage[]).map((u) => {
    const fit = usageFit(m, engine, u);
    return {
      usage: u,
      label: USAGE_LABEL[u],
      score: fit.score,
      suits: fit.score >= SUITS_THRESHOLD,
      reasons: fit.reasons as Reason[],
    };
  });
}
