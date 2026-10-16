"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { COST_DEFAULTS } from "@/config/costDefaults";
import { EXCHANGE_RATE } from "@/config/exchangeRate";
import { FUEL_PRICES } from "@/config/fuelPrices";
import { models } from "@/lib/data";
import { CYCLE_LABEL, ENERGY_LABEL, lei } from "@/lib/labels";
import {
  computeTco,
  TCO_CATEGORIES,
  type TcoCategory,
  type TcoInput,
} from "@/lib/tco";
import { CountUp } from "../CountUp";
import { card } from "../ui";

const TcoChart = dynamic(() => import("./TcoChart"), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-2 h-56 animate-pulse rounded-lg" aria-hidden />
  ),
});

type View = "lunar" | "anual" | "5ani";
const VIEW_LABEL: Record<View, string> = {
  lunar: "Lunar (medie)",
  anual: "Anual (medie)",
  "5ani": "Total 5 ani",
};
const YEARS = 5;

type Field = {
  key: keyof TcoInput;
  label: string;
  unit: string;
  why?: string;
  step?: number;
};
const FIXED: Field[] = [
  {
    key: "rcaYear",
    label: "RCA",
    unit: "lei/an",
    why: COST_DEFAULTS.rcaYear.why,
  },
  {
    key: "roadTaxYear",
    label: "Impozit auto",
    unit: "lei/an",
    why: COST_DEFAULTS.roadTaxYear.why,
  },
  {
    key: "itpPerInspection",
    label: "ITP",
    unit: "lei/inspecție",
    why: COST_DEFAULTS.itpPerInspection.why,
  },
  {
    key: "itpIntervalYears",
    label: "Ani între ITP-uri",
    unit: "ani",
    why: COST_DEFAULTS.itpIntervalYears.why,
  },
  {
    key: "vignetteYear",
    label: "Rovinietă",
    unit: "lei/an",
    why: COST_DEFAULTS.vignetteYear.why,
  },
  {
    key: "maintenanceYear",
    label: "Întreținere",
    unit: "lei/an",
    why: COST_DEFAULTS.maintenanceYear.why,
  },
  { key: "purchasePriceEur", label: "Preț de cumpărare", unit: "€" },
  {
    key: "depreciationPctYear",
    label: "Depreciere",
    unit: "%/an",
    why: COST_DEFAULTS.depreciationPctYear.why,
    step: 0.5,
  },
];

export function TcoCalculator() {
  const [modelId, setModelId] = useState("");
  const [engineIdx, setEngineIdx] = useState(0);
  const [view, setView] = useState<View>("lunar");
  const [input, setInput] = useState<TcoInput>({
    kmYear: 12000,
    consumptionL100: 6,
    fuelPrice: FUEL_PRICES.prices.benzina,
    rcaYear: COST_DEFAULTS.rcaYear.value,
    roadTaxYear: COST_DEFAULTS.roadTaxYear.value,
    itpPerInspection: COST_DEFAULTS.itpPerInspection.value,
    itpIntervalYears: COST_DEFAULTS.itpIntervalYears.value,
    vignetteYear: COST_DEFAULTS.vignetteYear.value,
    maintenanceYear: COST_DEFAULTS.maintenanceYear.value,
    purchasePriceEur: null,
    depreciationPctYear: COST_DEFAULTS.depreciationPctYear.value,
    eurRon: EXCHANGE_RATE.eurRon,
    years: YEARS,
  });
  const model = models.find((m) => m.id === modelId);
  const engine = model?.engines[engineIdx];
  const set = (k: keyof TcoInput, v: number | null) =>
    setInput((s) => ({ ...s, [k]: v }));

  function pickModel(id: string) {
    setModelId(id);
    setEngineIdx(0);
    const m = models.find((x) => x.id === id);
    const e = m?.engines[0];
    if (e && e.energy !== "hibrid" && e.energy !== "electric")
      setInput((s) => ({
        ...s,
        consumptionL100: e.consumption.value,
        fuelPrice:
          FUEL_PRICES.prices[e.energy as "benzina" | "motorina" | "gpl"],
        purchasePriceEur: m?.price_eur?.verified
          ? Math.round((m.price_eur.low + m.price_eur.high) / 2)
          : s.purchasePriceEur,
      }));
  }

  const result = useMemo(() => {
    try {
      return computeTco(input);
    } catch {
      return null;
    }
  }, [input]);
  const div = view === "lunar" ? YEARS * 12 : view === "anual" ? YEARS : 1;
  const chartData = result
    ? (Object.keys(TCO_CATEGORIES) as TcoCategory[]).map((c) => ({
        label: TCO_CATEGORIES[c],
        value: result.categoryTotals[c] / div,
        note: result.unset.includes(c) ? "necompletat" : undefined,
      }))
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <form
        className={`${card} space-y-4`}
        onSubmit={(e) => e.preventDefault()}
        aria-label="Date pentru calcul"
      >
        <label className="block text-sm">
          <span className="font-medium">Model (opțional)</span>
          <select
            value={modelId}
            onChange={(e) => pickModel(e.target.value)}
            className="border-line bg-surface-2 mt-1 w-full rounded-lg border px-2 py-2"
          >
            <option value="">Introduc manual</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.brand} {m.model} {m.generation} ({m.years.from}–{m.years.to})
              </option>
            ))}
          </select>
        </label>
        {model && model.engines.length > 1 && (
          <label className="block text-sm">
            <span className="font-medium">Motorizare</span>
            <select
              value={engineIdx}
              onChange={(e) => {
                const i = Number(e.target.value);
                setEngineIdx(i);
                const en = model.engines[i];
                if (en.energy !== "hibrid" && en.energy !== "electric")
                  setInput((s) => ({
                    ...s,
                    consumptionL100: en.consumption.value,
                    fuelPrice:
                      FUEL_PRICES.prices[
                        en.energy as "benzina" | "motorina" | "gpl"
                      ],
                  }));
              }}
              className="border-line bg-surface-2 mt-1 w-full rounded-lg border px-2 py-2"
            >
              {model.engines.map((en, i) => (
                <option key={i} value={i}>
                  {ENERGY_LABEL[en.energy]} {en.hp} CP, {en.consumption.value}{" "}
                  l/100 km ({CYCLE_LABEL[en.consumption.cycle]})
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Num
            label="Kilometri pe an"
            unit="km"
            value={input.kmYear}
            onChange={(v) => set("kmYear", v ?? 0)}
            required
          />
          <Num
            label="Consum"
            unit="l/100 km"
            step={0.1}
            value={input.consumptionL100}
            onChange={(v) => set("consumptionL100", v ?? 0)}
            hint={
              engine
                ? `declarat, ${CYCLE_LABEL[engine.consumption.cycle]}; real e de obicei mai mare`
                : undefined
            }
            required
          />
          <Num
            label="Preț carburant"
            unit="lei/l"
            step={0.01}
            value={input.fuelPrice}
            onChange={(v) => set("fuelPrice", v ?? 0)}
            hint={`medie ${FUEL_PRICES.updated}, ${FUEL_PRICES.source.title}; orientativ`}
            required
          />
          {FIXED.map((f) => (
            <Num
              key={f.key}
              label={f.label}
              unit={f.unit}
              step={f.step}
              value={input[f.key] as number | null}
              onChange={(v) => set(f.key, v)}
              hint={f.why}
            />
          ))}
        </div>
        <p className="text-muted text-xs">
          Deprecierea se calculează în lei cu cursul{" "}
          {EXCHANGE_RATE.eurRon !== null ? (
            <>
              1 € = {EXCHANGE_RATE.eurRon.toLocaleString("ro-RO")} lei (
              {EXCHANGE_RATE.source?.title}, {EXCHANGE_RATE.date})
            </>
          ) : (
            "necompletat"
          )}
          .
        </p>
      </form>

      <section className={`${card} space-y-4`} aria-labelledby="tco-out">
        <h2 id="tco-out" className="text-lg font-semibold">
          Rezultat (orientativ)
        </h2>
        <div
          role="radiogroup"
          aria-label="Perioadă"
          className="flex flex-wrap gap-2"
        >
          {(Object.keys(VIEW_LABEL) as View[]).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => setView(v)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${view === v ? "bg-accent text-on-accent border-accent font-semibold" : "border-line"}`}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
        {result ? (
          <>
            <p className="text-3xl font-bold" aria-live="polite">
              ~<CountUp value={result.total / div} format={lei} />
              <span className="text-muted ml-2 text-base font-normal">
                {VIEW_LABEL[view].toLowerCase()}
              </span>
            </p>
            {result.unset.length > 0 && (
              <p className="text-muted text-sm">
                Necompletate (calculate cu 0):{" "}
                {result.unset.map((c) => TCO_CATEGORIES[c]).join(", ")}.
              </p>
            )}
            <TcoChart
              title={`Pe categorii, ${VIEW_LABEL[view].toLowerCase()}`}
              data={chartData}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Costuri pe categorii</caption>
                <thead>
                  <tr className="border-line text-muted border-b">
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Categorie
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Lunar
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Anual
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      5 ani
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(TCO_CATEGORIES) as TcoCategory[]).map((c) => (
                    <tr key={c} className="border-line border-b last:border-0">
                      <th scope="row" className="py-2 pr-2 font-medium">
                        {TCO_CATEGORIES[c]}
                      </th>
                      {result.unset.includes(c) ? (
                        <td colSpan={3} className="text-muted py-2">
                          necompletat
                        </td>
                      ) : (
                        <>
                          <td className="py-2 pr-2 whitespace-nowrap">
                            {lei(result.categoryTotals[c] / (YEARS * 12))}
                          </td>
                          <td className="py-2 pr-2 whitespace-nowrap">
                            {lei(result.categoryTotals[c] / YEARS)}
                          </td>
                          <td className="py-2 whitespace-nowrap">
                            {lei(result.categoryTotals[c])}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <th scope="row" className="py-2 pr-2">
                      Total
                    </th>
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {lei(result.total / (YEARS * 12))}
                    </td>
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {lei(result.total / YEARS)}
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      {lei(result.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p role="alert" className="text-accent-text text-sm">
            Verifică valorile: trebuie să fie numere pozitive (deprecierea cel
            mult 100 %).
          </p>
        )}
      </section>
    </div>
  );
}

function Num(p: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (v: number | null) => void;
  hint?: string;
  step?: number;
  required?: boolean;
}) {
  const id = `tco-${p.label.replace(/\W+/g, "-")}`;
  const [draft, setDraft] = useState(p.value === null ? "" : String(p.value));
  const shown =
    String(p.value ?? "") === draft.replace(",", ".")
      ? draft
      : p.value === null
        ? ""
        : String(p.value);
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {p.label} <span className="text-muted font-normal">({p.unit})</span>
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={p.step ?? 1}
        value={shown}
        placeholder={p.required ? undefined : "necompletat"}
        onChange={(e) => {
          setDraft(e.target.value);
          const s = e.target.value.trim();
          if (s === "") return p.onChange(p.required ? 0 : null);
          const n = Number(s.replace(",", "."));
          if (Number.isFinite(n) && n >= 0) p.onChange(n);
        }}
        aria-describedby={p.hint ? `${id}-hint` : undefined}
        className="border-line bg-surface-2 mt-1 w-full rounded-lg border px-3 py-2"
      />
      {p.hint && (
        <p id={`${id}-hint`} className="text-muted mt-1 text-xs">
          {p.hint}
        </p>
      )}
    </div>
  );
}
