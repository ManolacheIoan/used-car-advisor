/**
 * Fit score — the only place where ranking is decided.
 *
 * 1. Hard filters (a mismatch removes the model): fuel, body type, seats (>= requested).
 * 2. Score 0–100 = 100 × (W.budget·B + W.cost·C + W.usage·U), each part in [0, 1]:
 *    B  budget fit: if the price range overlaps the budget, 0.5 + 0.5 × overlap / (narrower range);
 *       otherwise 0.5 × max(0, 1 − gap / (20% of budget max)). Continuous at the edge.
 *    C  monthly cost: min–max across the filtered candidates; cheapest = 1, dearest = 0.
 *    U  usage fit: additive rules per usage (see USAGE_RULES), capped at 1.
 * No reliability or quality signal is used in V1.
 */
import { monthlyCost, type CostAssumptions, type MonthlyCost } from "./cost";
import type { Body, CarModel, Engine } from "./types";

export const WEIGHTS = { budget: 0.4, cost: 0.3, usage: 0.3 } as const;
export const BUDGET_TOLERANCE = 0.2;
export const MAX_RESULTS = 10;

export type Usage = "oras" | "autostrada" | "familie" | "mixt";
export type Fuel = "benzina" | "motorina" | "gpl";

export interface Prefs {
  budgetMin: number;
  budgetMax: number;
  usage: Usage;
  fuel: Fuel | "oricare";
  body: Body | "oricare";
  seats: number;
  kmYear: number;
}

export interface Reason {
  text: string;
  positive: boolean;
}

export interface Result {
  model: CarModel;
  engine: Engine;
  cost: MonthlyCost;
  parts: { budget: number; cost: number; usage: number };
  score: number;
  reasons: Reason[];
}

const fmt = (n: number) => Math.round(n).toLocaleString("ro-RO");

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

interface Rule {
  test: (m: CarModel, e: Engine) => boolean;
  points: number;
  yes: string;
  no?: string;
}

/** Usage rules: base score + points for each rule met. Unmet rules with `no` add a negative chip. */
export const USAGE_RULES: Record<Usage, { base: number; rules: Rule[] }> = {
  oras: {
    base: 0.3,
    rules: [
      {
        test: (m) => m.body === "hatchback",
        points: 0.4,
        yes: "Compactă, ușor de parcat",
        no: "Mai mare decât e nevoie în oraș",
      },
      {
        test: (_, e) => e.consumption.value <= 6,
        points: 0.3,
        yes: "Consum declarat mic",
        no: "Consum declarat peste 6 l/100 km",
      },
    ],
  },
  autostrada: {
    base: 0.3,
    rules: [
      {
        test: (_, e) => e.energy === "motorina",
        points: 0.3,
        yes: "Motorină, potrivită pe distanțe lungi",
      },
      {
        test: (_, e) => e.hp >= 100,
        points: 0.4,
        yes: "Putere de cel puțin 100 CP",
        no: "Sub 100 CP pentru autostradă",
      },
    ],
  },
  familie: {
    base: 0.2,
    rules: [
      {
        test: (m) => m.trunk_l >= 400,
        points: 0.4,
        yes: "Portbagaj de cel puțin 400 l",
        no: "Portbagaj sub 400 l",
      },
      {
        test: (m) => ["break", "suv", "mpv"].includes(m.body),
        points: 0.2,
        yes: "Caroserie spațioasă",
      },
      { test: (m) => m.seats >= 5, points: 0.2, yes: "Cel puțin 5 locuri" },
    ],
  },
  mixt: {
    base: 0.5,
    rules: [
      {
        test: (_, e) => e.consumption.value <= 6.5,
        points: 0.25,
        yes: "Consum declarat moderat",
      },
      {
        test: (_, e) => e.hp >= 90,
        points: 0.25,
        yes: "Putere suficientă pentru drum",
      },
    ],
  },
};

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
  p: Pick<Prefs, "fuel" | "body" | "seats">,
): boolean {
  return (
    (p.fuel === "oricare" || m.engines.some((e) => e.energy === p.fuel)) &&
    (p.body === "oricare" || m.body === p.body) &&
    m.seats >= p.seats
  );
}

/** Engine used for the estimate: cheapest to run among those matching the chosen fuel. */
function pickEngine(
  m: CarModel,
  p: Prefs,
  a: CostAssumptions,
): { engine: Engine; cost: MonthlyCost } {
  return m.engines
    .filter((e) => p.fuel === "oricare" || e.energy === p.fuel)
    .map((engine) => ({ engine, cost: monthlyCost(engine, p.kmYear, a) }))
    .reduce((best, x) => (x.cost.total < best.cost.total ? x : best));
}

export function rank(
  models: CarModel[],
  p: Prefs,
  a: CostAssumptions,
): Result[] {
  const candidates = models
    .filter((m) => matchesHard(m, p))
    .map((m) => ({ m, ...pickEngine(m, p, a) }));
  if (candidates.length === 0) return [];

  const totals = candidates.map((c) => c.cost.total);
  const cMin = Math.min(...totals);
  const cMax = Math.max(...totals);

  return candidates
    .map(({ m, engine, cost }): Result => {
      const budget = budgetFit(m.price_ron, p.budgetMin, p.budgetMax);
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
        budgetReason(m.price_ron, p),
        {
          text: `~${fmt(cost.total)} lei/lună${costPart >= 0.75 ? ", printre cele mai mici" : ""}`,
          positive: costPart >= 0.5,
        },
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
        x.model.price_ron.min - y.model.price_ron.min ||
        x.model.id.localeCompare(y.model.id),
    )
    .slice(0, MAX_RESULTS);
}

export type RelaxKey = "fuel" | "body" | "seats";

/** For an empty result: how many models each single relaxation would bring back. */
export function relaxOptions(
  models: CarModel[],
  p: Prefs,
): { key: RelaxKey; count: number }[] {
  const variants: Record<RelaxKey, Prefs> = {
    fuel: { ...p, fuel: "oricare" },
    body: { ...p, body: "oricare" },
    seats: { ...p, seats: 2 },
  };
  return (Object.keys(variants) as RelaxKey[])
    .filter((k) => p[k] !== variants[k][k])
    .map((key) => ({
      key,
      count: models.filter((m) => matchesHard(m, variants[key])).length,
    }))
    .filter((o) => o.count > 0);
}
