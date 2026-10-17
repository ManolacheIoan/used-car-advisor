/**
 * Fit score — the only place where ranking is decided.
 *
 * 1. Hard filters (a mismatch removes the model): fuel, body type, brand, seats (>= requested).
 * 2. Score 0–100 = 100 × (W.budget·B + W.cost·C + W.usage·U), each part in [0, 1]:
 *    B  budget fit: if the price range overlaps the budget, 0.5 + 0.5 × overlap / (narrower range);
 *       otherwise 0.5 × max(0, 1 − gap / (20% of budget max)). Continuous at the edge.
 *    C  monthly cost: min–max across the filtered candidates; cheapest = 1, dearest = 0.
 *    U  usage fit: additive rules per usage (see src/config/usageRules.ts), capped at 1.
 * No reliability or quality signal is used in V1.
 */
import { monthlyCost, type CostAssumptions, type MonthlyCost } from "./cost";
import { USAGE_RULES } from "@/config/usageRules";
import { brandId } from "./brand";
import type { Body, CarModel, Engine, Usage } from "./types";

export const WEIGHTS = { budget: 0.4, cost: 0.3, usage: 0.3 } as const;
export const BUDGET_TOLERANCE = 0.2;
export const MAX_RESULTS = 10;

export type { Usage };
export type Fuel = "benzina" | "motorina" | "gpl";

export interface Prefs {
  budgetMin: number;
  budgetMax: number;
  usage: Usage;
  fuel: Fuel | "oricare";
  body: Body | "oricare";
  /** Brand id (see lib/brand.ts) or "oricare". */
  brand: string;
  seats: number;
  kmYear: number;
}

/** Models with a verified price; only these are ranked. */
export type PricedModel = CarModel & {
  price_eur: NonNullable<CarModel["price_eur"]>;
};
export const hasPrice = (m: CarModel): m is PricedModel => !!m.price_eur;

export interface Reason {
  text: string;
  positive: boolean;
}

export interface Result {
  model: PricedModel;
  engine: Engine;
  cost: MonthlyCost;
  parts: { budget: number; cost: number; usage: number };
  score: number;
  reasons: Reason[];
}

function costReason(costPart: number): Reason {
  if (costPart >= 0.75)
    return { text: "Cost lunar printre cele mai mici", positive: true };
  if (costPart >= 0.5) return { text: "Cost lunar mediu", positive: true };
  return { text: "Cost lunar mai mare decât alternativele", positive: false };
}

export function budgetFit(
  price: { min: number; max: number },
  min: number,
  max: number,
): number {
  const overlap = Math.min(price.max, max) - Math.max(price.min, min);
  if (overlap >= 0) {
    const narrower = Math.min(price.max - price.min, max - min);
    return narrower === 0 ? 1 : 0.5 + (0.5 * overlap) / narrower;
  }
  const gap = price.min > max ? price.min - max : min - price.max;
  const tolerance = BUDGET_TOLERANCE * max;
  return tolerance === 0 ? 0 : 0.5 * Math.max(0, 1 - gap / tolerance);
}

function budgetReason(price: { min: number; max: number }, p: Prefs): Reason {
  if (price.min >= p.budgetMin && price.max <= p.budgetMax)
    return { text: "Integral în buget", positive: true };
  if (price.min <= p.budgetMax && price.max >= p.budgetMin)
    return { text: "Parțial în buget", positive: true };
  if (price.min > p.budgetMax) return { text: "Peste buget", positive: false };
  return { text: "Sub bugetul ales", positive: true };
}

export function usageFit(
  m: CarModel,
  e: Engine,
  usage: Usage,
): { score: number; reasons: Reason[] } {
  const { base, rules } = USAGE_RULES[usage];
  let score = base;
  const reasons: Reason[] = [];
  for (const r of rules) {
    if (r.test(m, e)) {
      score += r.points;
      reasons.push({ text: r.yes, positive: true });
    } else if (r.no) {
      reasons.push({ text: r.no, positive: false });
    }
  }
  return { score: Math.min(1, score), reasons };
}

export function matchesHard(
  m: CarModel,
  p: Pick<Prefs, "fuel" | "body" | "seats" | "brand">,
): boolean {
  return (
    (p.fuel === "oricare" || m.engines.some((e) => e.energy === p.fuel)) &&
    (p.body === "oricare" || m.body === p.body) &&
    (p.brand === "oricare" || brandId(m.brand) === p.brand) &&
    m.seats >= p.seats
  );
}

/** Engines the V1 cost model can estimate (petrol, diesel, LPG) that match the chosen fuel. */
function costableEngines(m: CarModel, fuel: Prefs["fuel"]): Engine[] {
  return m.engines.filter((e) =>
    fuel === "oricare"
      ? e.energy !== "hibrid" && e.energy !== "electric"
      : e.energy === fuel,
  );
}

/** True when the model has at least one engine whose running cost can be estimated. */
export const hasCostableEngine = (
  m: CarModel,
  fuel: Prefs["fuel"] = "oricare",
) => costableEngines(m, fuel).length > 0;

/**
 * Engine used for the estimate: cheapest to run among those matching the chosen fuel.
 * null when the model has none (e.g. only hybrid/electric engines, or no engines); such models are skipped.
 */
export function pickEngine(
  m: CarModel,
  fuel: Prefs["fuel"],
  kmYear: number,
  a: CostAssumptions,
): { engine: Engine; cost: MonthlyCost } | null {
  let best: { engine: Engine; cost: MonthlyCost } | null = null;
  for (const engine of costableEngines(m, fuel)) {
    const cost = monthlyCost(engine, kmYear, a);
    if (!best || cost.total < best.cost.total) best = { engine, cost };
  }
  return best;
}

export function rank(
  models: CarModel[],
  p: Prefs,
  a: CostAssumptions,
): Result[] {
  const candidates = models
    .filter(hasPrice)
    .filter((m) => matchesHard(m, p))
    .flatMap((m) => {
      const picked = pickEngine(m, p.fuel, p.kmYear, a);
      return picked ? [{ m, ...picked }] : [];
    });
  if (candidates.length === 0) return [];

  const totals = candidates.map((c) => c.cost.total);
  const cMin = Math.min(...totals);
  const cMax = Math.max(...totals);

  return candidates
    .map(({ m, engine, cost }): Result => {
      const range = { min: m.price_eur.low, max: m.price_eur.high };
      const budget = budgetFit(range, p.budgetMin, p.budgetMax);
      const costPart =
        cMax === cMin ? 1 : 1 - (cost.total - cMin) / (cMax - cMin);
      const usage = usageFit(m, engine, p.usage);
      const score = Math.round(
        100 *
          (WEIGHTS.budget * budget +
            WEIGHTS.cost * costPart +
            WEIGHTS.usage * usage.score),
      );
      const reasons: Reason[] = [
        budgetReason(range, p),
        costReason(costPart),
        ...usage.reasons,
      ];
      return {
        model: m,
        engine,
        cost,
        parts: { budget, cost: costPart, usage: usage.score },
        score,
        reasons,
      };
    })
    .sort(
      (x, y) =>
        y.score - x.score ||
        x.model.price_eur.low - y.model.price_eur.low ||
        x.model.id.localeCompare(y.model.id),
    )
    .slice(0, MAX_RESULTS);
}

export type RelaxKey = "fuel" | "body" | "brand" | "seats";

/** For an empty result: how many models each single relaxation would bring back. */
export function relaxOptions(
  models: CarModel[],
  p: Prefs,
): { key: RelaxKey; count: number }[] {
  const variants: Record<RelaxKey, Prefs> = {
    fuel: { ...p, fuel: "oricare" },
    body: { ...p, body: "oricare" },
    brand: { ...p, brand: "oricare" },
    seats: { ...p, seats: 2 },
  };
  return (Object.keys(variants) as RelaxKey[])
    .filter((k) => p[k] !== variants[k][k])
    .map((key) => ({
      key,
      count: models.filter((m) => hasPrice(m) && matchesHard(m, variants[key]))
        .length,
    }))
    .filter((o) => o.count > 0);
}
