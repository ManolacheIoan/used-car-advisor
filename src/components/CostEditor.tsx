"use client";

import { useState } from "react";
import { DEFAULT_ASSUMPTIONS, type CostAssumptions } from "@/lib/cost";

const FIELDS = [
  ["benzina", "Benzină (lei/l)"],
  ["motorina", "Motorină (lei/l)"],
  ["gpl", "GPL (lei/l)"],
  ["insuranceYear", "RCA (lei/an)"],
  ["roadTaxYear", "Impozit auto (lei/an)"],
  ["maintenanceYear", "Întreținere (lei/an)"],
] as const;

type Key = (typeof FIELDS)[number][0];

const get = (a: CostAssumptions, k: Key) =>
  k === "benzina" || k === "motorina" || k === "gpl" ? a.fuelPrice[k] : a[k];

function with_(a: CostAssumptions, k: Key, v: number): CostAssumptions {
  return k === "benzina" || k === "motorina" || k === "gpl"
    ? { ...a, fuelPrice: { ...a.fuelPrice, [k]: v } }
    : { ...a, [k]: v };
}

/** Editable cost assumptions. Only valid (finite, >= 0) values are propagated. */
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
        FIELDS.map(([k]) => [k, String(get(value, k))]),
      ) as Record<Key, string>,
  );

  function edit(k: Key, s: string) {
    setDraft((d) => ({ ...d, [k]: s }));
    const n = Number(s.replace(",", "."));
    if (s.trim() !== "" && Number.isFinite(n) && n >= 0)
      onChange(with_(value, k, n));
  }

  function reset() {
    setDraft(
      Object.fromEntries(
        FIELDS.map(([k]) => [k, String(get(DEFAULT_ASSUMPTIONS, k))]),
      ) as Record<Key, string>,
    );
    onChange(DEFAULT_ASSUMPTIONS);
  }

  return (
    <details className="border-line bg-surface rounded-xl border p-4">
      <summary className="cursor-pointer font-semibold">
        Ipoteze pentru costul lunar (orientativ)
      </summary>
      <p className="text-muted mt-2 text-sm">
        Valori aproximative, de verificat. Modifică-le după situația ta;
        costurile se recalculează imediat.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map(([k, label]) => {
          const n = Number(draft[k].replace(",", "."));
          const invalid =
            draft[k].trim() === "" || !Number.isFinite(n) || n < 0;
          return (
            <div key={k}>
              <label htmlFor={`a-${k}`} className="text-sm">
                {label}
              </label>
              <input
                id={`a-${k}`}
                inputMode="decimal"
                value={draft[k]}
                onChange={(e) => edit(k, e.target.value)}
                aria-invalid={invalid}
                className="border-line bg-surface-2 aria-invalid:border-accent mt-1 w-full rounded-lg border px-3 py-2"
              />
              {invalid && (
                <p className="text-accent-text mt-1 text-xs">
                  Valoare invalidă, se folosește ultima validă.
                </p>
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
