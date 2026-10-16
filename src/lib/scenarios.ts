import { SCENARIOS } from "@/config/scenarios";
import { DEFAULT_ASSUMPTIONS } from "./cost";
import { rank, type Result } from "./scoring";
import type { CarModel } from "./types";

export const SCENARIO_TOP = 3;

/** Only verified, non-demo models; demo rows and unverified rows are never used. */
export function scenarioResults(models: CarModel[], scenarios = SCENARIOS) {
  const verified = models.filter((m) => !m.is_demo && m.verified);
  return scenarios.map((s) => ({
    ...s,
    results: rank(verified, s.prefs, DEFAULT_ASSUMPTIONS).slice(
      0,
      SCENARIO_TOP,
    ) as Result[],
  }));
}
