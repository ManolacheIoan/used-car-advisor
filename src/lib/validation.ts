import { DEFAULT_ASSUMPTIONS, type CostAssumptions } from "./cost";
import type { Prefs } from "./scoring";

export const LIMITS = {
  budget: { min: 1000, max: 1_000_000 },
  km: { min: 1000, max: 100_000 },
  seats: [2, 4, 5, 7] as const,
};

const USAGES = ["oras", "autostrada", "familie", "mixt"] as const;
const FUELS = ["oricare", "benzina", "motorina", "gpl"] as const;
const BODIES = [
  "oricare",
  "hatchback",
  "sedan",
  "break",
  "suv",
  "mpv",
] as const;

export type PrefsInput = Record<keyof Prefs, string>;
export type FieldErrors = Partial<Record<keyof Prefs, string>>;

const toInt = (s: string | null | undefined) =>
  s != null && /^\d+$/.test(s.trim()) ? Number(s) : NaN;
const oneOf = <T extends string>(list: readonly T[], v: string): v is T =>
  (list as readonly string[]).includes(v);

/** Validates raw string input. Returns parsed prefs or Romanian error messages per field. */
export function validatePrefs(raw: Partial<PrefsInput>): {
  prefs?: Prefs;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};
  const bmin = toInt(raw.budgetMin);
  const bmax = toInt(raw.budgetMax);
  const km = toInt(raw.kmYear);
  const seats = toInt(raw.seats);
  const { budget } = LIMITS;

  if (!(bmin >= budget.min && bmin <= budget.max))
    errors.budgetMin = `Introdu o sumă între ${budget.min.toLocaleString("ro-RO")} și ${budget.max.toLocaleString("ro-RO")} lei.`;
  if (!(bmax >= budget.min && bmax <= budget.max))
    errors.budgetMax = `Introdu o sumă între ${budget.min.toLocaleString("ro-RO")} și ${budget.max.toLocaleString("ro-RO")} lei.`;
  else if (bmin > bmax)
    errors.budgetMax =
      "Bugetul maxim trebuie să fie cel puțin egal cu minimul.";
  if (!oneOf(USAGES, raw.usage ?? ""))
    errors.usage = "Alege cum folosești mașina.";
  if (!oneOf(FUELS, raw.fuel ?? "")) errors.fuel = "Alege combustibilul.";
  if (!oneOf(BODIES, raw.body ?? "")) errors.body = "Alege tipul de caroserie.";
  if (!(LIMITS.seats as readonly number[]).includes(seats))
    errors.seats = "Alege numărul de locuri.";
  if (!(km >= LIMITS.km.min && km <= LIMITS.km.max))
    errors.kmYear = `Introdu între ${LIMITS.km.min.toLocaleString("ro-RO")} și ${LIMITS.km.max.toLocaleString("ro-RO")} km pe an.`;

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    prefs: {
      budgetMin: bmin,
      budgetMax: bmax,
      usage: raw.usage as Prefs["usage"],
      fuel: raw.fuel as Prefs["fuel"],
      body: raw.body as Prefs["body"],
      seats,
      kmYear: km,
    },
  };
}

// URL query keys. Kept short so result links stay shareable.
export const PREF_KEYS: Record<keyof Prefs, string> = {
  budgetMin: "bmin",
  budgetMax: "bmax",
  usage: "u",
  fuel: "f",
  body: "c",
  seats: "s",
  kmYear: "km",
};

export function prefsToQuery(
  p: Prefs,
  q = new URLSearchParams(),
): URLSearchParams {
  for (const [k, short] of Object.entries(PREF_KEYS))
    q.set(short, String(p[k as keyof Prefs]));
  return q;
}

export function prefsFromQuery(q: URLSearchParams) {
  const raw = Object.fromEntries(
    Object.entries(PREF_KEYS).map(([k, short]) => [k, q.get(short) ?? ""]),
  ) as PrefsInput;
  return validatePrefs(raw);
}

const ASSUMPTION_KEYS = {
  benzina: "pb",
  motorina: "pm",
  gpl: "pg",
  insuranceYear: "rca",
  roadTaxYear: "tax",
  maintenanceYear: "mnt",
} as const;

const flat = (a: CostAssumptions) => ({
  ...a.fuelPrice,
  insuranceYear: a.insuranceYear,
  roadTaxYear: a.roadTaxYear,
  maintenanceYear: a.maintenanceYear,
});

/** Writes only the values that differ from the defaults. */
export function assumptionsToQuery(
  a: CostAssumptions,
  q = new URLSearchParams(),
): URLSearchParams {
  const cur = flat(a);
  const def = flat(DEFAULT_ASSUMPTIONS);
  for (const [k, short] of Object.entries(ASSUMPTION_KEYS)) {
    const key = k as keyof typeof cur;
    if (cur[key] !== def[key]) q.set(short, String(cur[key]));
    else q.delete(short);
  }
  return q;
}

/** Reads assumptions from the URL; invalid or missing values fall back to defaults. */
export function assumptionsFromQuery(q: URLSearchParams): CostAssumptions {
  const def = flat(DEFAULT_ASSUMPTIONS);
  const v = { ...def };
  for (const [k, short] of Object.entries(ASSUMPTION_KEYS)) {
    const n = Number(q.get(short));
    if (q.has(short) && Number.isFinite(n) && n >= 0)
      v[k as keyof typeof v] = n;
  }
  return {
    fuelPrice: { benzina: v.benzina, motorina: v.motorina, gpl: v.gpl },
    insuranceYear: v.insuranceYear,
    roadTaxYear: v.roadTaxYear,
    maintenanceYear: v.maintenanceYear,
  };
}
