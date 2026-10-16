/** Budget helper: which models fit a monthly budget by running cost (cheapest-to-run engine of each model). */
import type { CostAssumptions } from "./cost";
import { pickEngine } from "./scoring";
import type { CarModel } from "./types";

export function modelsWithinBudget(
  models: CarModel[],
  budgetMonthLei: number,
  kmYear: number,
  a: CostAssumptions,
) {
  if (!(Number.isFinite(budgetMonthLei) && budgetMonthLei >= 0))
    throw new RangeError("budget must be ≥ 0");
  return models
    .map((m) => ({ m, ...pickEngine(m, "oricare", kmYear, a) }))
    .map((x) => ({ ...x, left: budgetMonthLei - x.cost.total }))
    .filter((x) => x.left >= 0)
    .sort(
      (x, y) => x.cost.total - y.cost.total || x.m.id.localeCompare(y.m.id),
    );
}
