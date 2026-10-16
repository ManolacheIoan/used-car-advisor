"use client";

import { useState } from "react";
import { COST_DEFAULTS } from "@/config/costDefaults";
import { FUEL_PRICES } from "@/config/fuelPrices";
import { DEFAULT_ASSUMPTIONS, type CostAssumptions } from "@/lib/cost";

const FUEL = ["benzina", "motorina", "gpl"] as const;
const FIELDS = [
  ["benzina", "Benzină (lei/l)"],
  ["motorina", "Motorină (lei/l)"],
  ["gpl", "GPL (lei/l)"],
  ["insuranceYear", "RCA (lei/an)"],
  ["roadTaxYear", "Impozit auto (lei/an)"],
  ["maintenanceYear", "Întreținere (lei/an)"],
] as const;
const WHY: Record<string, string> = {
  insuranceYear: COST_DEFAULTS.rcaYear.why,
  roadTaxYear: COST_DEFAULTS.roadTaxYear.why,
  maintenanceYear: COST_DEFAULTS.maintenanceYear.why,
};

type Key = (typeof FIELDS)[number][0];
const isFuel = (k: Key): k is (typeof FUEL)[number] =>
  (FUEL as readonly string[]).includes(k);

const get = (a: CostAssumptions, k: Key) => (isFuel(k) ? a.fuelPrice[k] : a[k]);
const str = (v: number | null) => (v === null ? "" : String(v));

function with_(a: CostAssumptions, k: Key, v: number | null): CostAssumptions {
  return isFuel(k)
    ? { ...a, fuelPrice: { ...a.fuelPrice, [k]: v ?? a.fuelPrice[k] } }
    : { ...a, [k]: v };
}

/**
 * Editable cost assumptions (orientativ). Fuel prices default to the dated, sourced config; fixed costs start empty
 * ("necompletat") because no official default exists. Only valid values (finite, ≥ 0) are propagated.
 */
export function CostEditor({
  value,
  onChange,
}: {
  value: CostAssumptions;
  onChange: (a: CostAssumptions) => void;
}) {
  const [draft, setDraft] = useState<Record<Key, string>>(
    () =>
      Object.fromEntries(
        FIELDS.map(([k]) => [k, str(get(value, k))]),
      ) as Record<Key, string>,
  );

  function edit(k: Key, s: string) {
    setDraft((d) => ({ ...d, [k]: s }));
    if (s.trim() === "") {
      if (!isFuel(k)) onChange(with_(value, k, null));
      return;
    }
    const n = Number(s.replace(",", "."));
    if (Number.isFinite(n) && n >= 0) onChange(with_(value, k, n));
  }

  function reset() {
    setDraft(
      Object.fromEntries(
        FIELDS.map(([k]) => [k, str(get(DEFAULT_ASSUMPTIONS, k))]),
      ) as Record<Key, string>,
    );
    onChange(DEFAULT_ASSUMPTIONS);
  }

  return (
    <details className="card p-4">
      <summary className="cursor-pointer font-semibold">
        Ipoteze pentru costul lunar (orientativ)
      </summary>
      <p className="text-muted mt-2 text-sm">
        Prețurile carburanților sunt medii naționale din {FUEL_PRICES.updated} (
        {FUEL_PRICES.source.title}). RCA, impozitul și întreținerea nu au valori
        implicite: completează-le pentru situația ta.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map(([k, label]) => {
          const s = draft[k];
          const n = Number(s.replace(",", "."));
          const invalid =
            (s.trim() === "" && isFuel(k)) ||
            (s.trim() !== "" && (!Number.isFinite(n) || n < 0));
          return (
            <div key={k}>
              <label htmlFor={`a-${k}`} className="text-sm">
                {label}
              </label>
              <input
                id={`a-${k}`}
                inputMode="decimal"
                value={s}
                placeholder={isFuel(k) ? undefined : "necompletat"}
                onChange={(e) => edit(k, e.target.value)}
                aria-invalid={invalid}
                aria-describedby={WHY[k] ? `a-${k}-why` : undefined}
                className="border-line bg-surface-2 aria-invalid:border-accent mt-1 w-full rounded-lg border px-3 py-2"
              />
              {invalid ? (
                <p className="text-accent-text mt-1 text-xs">
                  Valoare invalidă, se folosește ultima validă.
                </p>
              ) : (
                WHY[k] && (
                  <p id={`a-${k}-why`} className="text-muted mt-1 text-xs">
                    {WHY[k]}
                  </p>
                )
              )}
            </div>
          );
        })}
      </div>
      <button type="button" onClick={reset} className="mt-3 text-sm underline">
        Revino la valorile implicite
      </button>
    </details>
  );
}
