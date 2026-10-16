import { SCENARIOS } from "@/config/scenarios";
import { DEFAULT_ASSUMPTIONS } from "./cost";
import { rank, type Result } from "./scoring";
import type { CarModel } from "./types";

export const SCENARIO_TOP = 3;

/** Only real, verified models; examples and models still awaiting verification are excluded. */
export function scenarioResults(models: CarModel[], scenarios = SCENARIOS) {
  const verified = models.filter((m) => !m.example && m.verified !== false);
  return scenarios.map((s) => ({
    ...s,
    results: rank(verified, s.prefs, DEFAULT_ASSUMPTIONS).slice(
      0,
      SCENARIO_TOP,
    ) as Result[],
  }));
}
