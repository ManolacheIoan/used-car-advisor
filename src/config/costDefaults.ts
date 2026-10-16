/**
 * Defaults for every cost input (all "orientativ"). A value is set ONLY when it comes from an official source that
 * was actually fetched (URL + date). Otherwise it is null and the user types it; totals then show it as "necompletat".
 */
export interface CostDefault {
  value: number | null;
  unit: string;
  source: { title: string; url: string } | null;
  date: string | null;
  /** Why the field has no default (shown next to the input). */
  why: string;
}

export const COST_DEFAULTS = {
  rcaYear: {
    value: null,
    unit: "lei/an",
    source: null,
    date: null,
    why: "Prețul RCA depinde de asigurător, de vârstă, de localitate și de istoricul tău (bonus-malus).",
  },
  roadTaxYear: {
    value: null,
    unit: "lei/an",
    source: null,
    date: null,
    why: "Impozitul depinde de cilindree, de normă și de decizia consiliului local; îl găsești la primăria ta.",
  },
  itpPerInspection: {
    value: null,
    unit: "lei/inspecție",
    source: null,
    date: null,
    why: "Tariful ITP este stabilit de fiecare stație autorizată RAR.",
  },
  itpIntervalYears: {
    value: null,
    unit: "ani între inspecții",
    source: null,
    date: null,
    why: "Periodicitatea depinde de vârsta și tipul mașinii; verifică pe site-ul RAR.",
  },
  vignetteYear: {
    value: null,
    unit: "lei/an",
    source: null,
    date: null,
    why: "Tarifele rovinietei/TollRo s-au schimbat în 2026 și nu am o sursă oficială citită; verifică la CNAIR.",
  },
  maintenanceYear: {
    value: null,
    unit: "lei/an",
    source: null,
    date: null,
    why: "Revizii, piese și anvelope: depind de model, de km și de service.",
  },
  depreciationPctYear: {
    value: null,
    unit: "% din preț pe an",
    source: null,
    date: null,
    why: "Nu avem o sursă pentru pierderea anuală de valoare; introdu propria estimare.",
  },
} satisfies Record<string, CostDefault>;
