import { SCENARIOS } from "@/config/scenarios";
import { DEFAULT_ASSUMPTIONS } from "./cost";
import { rank, type Result } from "./scoring";
import type { CarModel } from "./types";

export const SCENARIO_TOP = 3;

/**
 * Only verified, non-demo models; demo rows and unverified rows are never used, except with `includeDemo`
 * (set only in demo builds, which are never deployed).
 */
export function scenarioResults(
  models: CarModel[],
  scenarios = SCENARIOS,
  { includeDemo = false } = {},
) {
  const verified = models.filter(
    (m) => (includeDemo && m.is_demo) || (!m.is_demo && m.verified),
  );
  return scenarios.map((s) => ({
    ...s,
    results: rank(verified, s.prefs, DEFAULT_ASSUMPTIONS).slice(
      0,
      SCENARIO_TOP,
    ) as Result[],
  }));
}
