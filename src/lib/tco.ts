/**
 * Total cost of ownership (orientativ). Every input is user-editable; fixed costs without an official default are
 * null ("necompletat") and count as 0, listed in `unset`.
 *  fuel/year       = km × consumption/100 × fuel price (declared consumption, so real cost is usually higher)
 *  RCA, tax, vignette, maintenance: yearly amounts as entered
 *  ITP/year        = cost per inspection ÷ years between inspections (amortised)
 *  depreciation    = purchase price × (1 − pct)^(y−1) − price × (1 − pct)^y, converted EUR → RON with the rate
 */
export interface TcoInput {
  kmYear: number;
  consumptionL100: number;
  fuelPrice: number;
  rcaYear: number | null;
  roadTaxYear: number | null;
  itpPerInspection: number | null;
  itpIntervalYears: number | null;
  vignetteYear: number | null;
  maintenanceYear: number | null;
  purchasePriceEur: number | null;
  depreciationPctYear: number | null;
  eurRon: number | null;
  years: number;
}

export const TCO_CATEGORIES = {
  fuel: "Carburant",
  rca: "RCA",
  tax: "Impozit",
  itp: "ITP",
  vignette: "Rovinietă",
  maintenance: "Întreținere",
  depreciation: "Depreciere",
} as const;
export type TcoCategory = keyof typeof TCO_CATEGORIES;

export interface TcoResult {
  perYear: Record<TcoCategory, number>[];
  yearTotals: number[];
  categoryTotals: Record<TcoCategory, number>;
  total: number;
  monthlyAverage: number;
  unset: TcoCategory[];
}

const nn = (v: number | null) =>
  v !== null && Number.isFinite(v) && v >= 0 ? v : null;

export function computeTco(i: TcoInput): TcoResult {
  if (!(i.years >= 1 && Number.isInteger(i.years)))
    throw new RangeError("years must be a positive integer");
  for (const [k, v] of Object.entries(i))
    if (typeof v === "number" && (!Number.isFinite(v) || v < 0))
      throw new RangeError(`${k} must be ≥ 0`);
  if (i.depreciationPctYear !== null && i.depreciationPctYear > 100)
    throw new RangeError("depreciationPctYear must be ≤ 100");

  const unset = new Set<TcoCategory>();
  const fixed = (v: number | null, cat: TcoCategory) => {
    if (nn(v) === null) unset.add(cat);
    return nn(v) ?? 0;
  };
  const itp =
    nn(i.itpPerInspection) !== null && nn(i.itpIntervalYears)
      ? i.itpPerInspection! / i.itpIntervalYears!
      : (unset.add("itp"), 0);
  const canDepreciate =
    nn(i.purchasePriceEur) !== null &&
    nn(i.depreciationPctYear) !== null &&
    nn(i.eurRon) !== null;
  if (!canDepreciate) unset.add("depreciation");

  const perYear: Record<TcoCategory, number>[] = [];
  for (let y = 1; y <= i.years; y++) {
    const r = 1 - (i.depreciationPctYear ?? 0) / 100;
    const dep = canDepreciate
      ? i.purchasePriceEur! * (r ** (y - 1) - r ** y) * i.eurRon!
      : 0;
    perYear.push({
      fuel: i.kmYear * (i.consumptionL100 / 100) * i.fuelPrice,
      rca: fixed(i.rcaYear, "rca"),
      tax: fixed(i.roadTaxYear, "tax"),
      itp,
      vignette: fixed(i.vignetteYear, "vignette"),
      maintenance: fixed(i.maintenanceYear, "maintenance"),
      depreciation: dep,
    });
  }
  const sum = (o: Record<TcoCategory, number>) =>
    Object.values(o).reduce((s, v) => s + v, 0);
  const yearTotals = perYear.map(sum);
  const categoryTotals = Object.fromEntries(
    (Object.keys(TCO_CATEGORIES) as TcoCategory[]).map((c) => [
      c,
      perYear.reduce((s, y) => s + y[c], 0),
    ]),
  ) as Record<TcoCategory, number>;
  const total = yearTotals.reduce((s, v) => s + v, 0);
  return {
    perYear,
    yearTotals,
    categoryTotals,
    total,
    monthlyAverage: total / (i.years * 12),
    unset: [...unset],
  };
}
