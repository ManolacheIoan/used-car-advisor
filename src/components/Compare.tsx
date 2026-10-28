"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { bestIndexes, differs } from "@/lib/compareHighlight";
import { COST_NOTE } from "@/lib/cost";
import { getModel, models } from "@/lib/data";
import {
  BODY_LABEL,
  consumptionText,
  ENERGY_LABEL,
  engineSummary,
  generationLabel,
  lei,
  MIXED_CYCLES_NOTE,
  mixedCycles,
  priceRange,
} from "@/lib/labels";
import { hasCostableEngine, pickEngine, rank } from "@/lib/scoring";
import type { CarModel } from "@/lib/types";
import { prefsFromQuery } from "@/lib/validation";
import { BodyIcon } from "./BodyIcon";
import { CostEditor } from "./CostEditor";
import { priceNote } from "./PriceNote";
import { PrintButton } from "./PrintButton";
import { ShareButton } from "./ShareButton";
import { CountUp } from "./CountUp";
import { MAX_COMPARE } from "./Results";
import { BackToForm, btnGhost, card, Morph, Notice } from "./ui";
import { useUrlAssumptions } from "./useUrlAssumptions";

export const DEFAULT_KM = 12000;

export function Compare() {
  const [assumptions, setAssumptions, query] = useUrlAssumptions();
  const [onlyDiff, setOnlyDiff] = useState(false);
  const picked = (query.get("ids") ?? "")
    .split(",")
    .map((id) => getModel(id))
    .filter((m): m is CarModel => !!m && hasCostableEngine(m))
    .slice(0, MAX_COMPARE);
  const { prefs } = prefsFromQuery(query);

  if (picked.length < 2)
    return (
      <Notice title="Alege cel puțin 2 modele de comparat" tone="error">
        <p className="text-muted">
          Selectează modelele din lista de recomandări.
        </p>
        <BackToForm />
      </Notice>
    );

  const scores = new Map(
    prefs ? rank(models, prefs, assumptions).map((r) => [r.model.id, r]) : [],
  );
  const cols = picked.map((m) => {
    const r = scores.get(m.id);
    // A model ranked under other prefs may lack the chosen fuel; fall back to any costable engine.
    const est =
      r ??
      pickEngine(
        m,
        prefs?.fuel ?? "oricare",
        prefs?.kmYear ?? DEFAULT_KM,
        assumptions,
      ) ??
      pickEngine(m, "oricare", prefs?.kmYear ?? DEFAULT_KM, assumptions)!;
    return { m, score: r?.score, engine: est.engine, cost: est.cost };
  });
  const back = new URLSearchParams(query);
  back.delete("ids");

  type Col = (typeof cols)[number];
  /** `metric` marks the best value; `text` is used to detect rows where the models differ. */
  const rows: {
    label: string;
    cell: (c: Col) => ReactNode;
    text: (c: Col) => string;
    metric?: (c: Col) => number | null;
    dir?: "min" | "max";
  }[] = [
    {
      label: "Scor",
      cell: (c) => (c.score !== undefined ? `${c.score}/100` : "—"),
      text: (c) => String(c.score ?? ""),
      metric: (c) => c.score ?? null,
      dir: "max",
    },
    {
      label: "Generație",
      cell: (c) => generationLabel(c.m),
      text: (c) => generationLabel(c.m),
    },
    {
      label: "Caroserie",
      cell: (c) => BODY_LABEL[c.m.body],
      text: (c) => c.m.body,
    },
    {
      label: "Motorizări",
      cell: (c) => engineSummary(c.m),
      text: (c) => engineSummary(c.m),
    },
    {
      label: "Locuri",
      cell: (c) => c.m.seats,
      text: (c) => String(c.m.seats),
      metric: (c) => c.m.seats,
      dir: "max",
    },
    {
      label: "Portbagaj",
      cell: (c) => `${c.m.trunk_l} l`,
      text: (c) => String(c.m.trunk_l),
      metric: (c) => c.m.trunk_l,
      dir: "max",
    },
    {
      label: "Preț",
      cell: (c) => (
        <>
          {priceRange(c.m)}
          {c.m.price_eur && (
            <span className="text-muted block text-xs">
              {priceNote(c.m.price_eur)}
            </span>
          )}
        </>
      ),
      text: (c) => priceRange(c.m),
      metric: (c) => (c.m.price_eur?.verified ? c.m.price_eur.low : null),
      dir: "min",
    },
    {
      label: "Motor estimat",
      cell: (c) => `${ENERGY_LABEL[c.engine.energy]}, ${c.engine.hp} CP`,
      text: (c) => `${c.engine.energy}${c.engine.hp}`,
      metric: (c) => c.engine.hp,
      dir: "max",
    },
    {
      label: "Consum declarat",
      cell: (c) => consumptionText(c.engine),
      text: (c) => consumptionText(c.engine),
      // Best value only when every model uses the same test cycle.
      metric: (c) =>
        mixedCycles(cols.map((x) => x.engine))
          ? null
          : c.engine.consumption.value,
      dir: "min",
    },
    {
      label: "Cost lunar",
      cell: (c) => (
        <>
          <strong>
            ~<CountUp value={c.cost.total} format={lei} />
          </strong>{" "}
          <span className="text-muted text-xs">{COST_NOTE}</span>
        </>
      ),
      text: (c) => String(Math.round(c.cost.total)),
      metric: (c) => c.cost.total,
      dir: "min",
    },
  ];
  const visibleRows = onlyDiff
    ? rows.filter((r) => differs(cols.map(r.text)))
    : rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted text-sm">
          Cost calculat pentru{" "}
          {(prefs?.kmYear ?? DEFAULT_KM).toLocaleString("ro-RO")} km/an.
        </p>
        <Link
          href={prefs ? `/rezultate/?${back}` : "/"}
          className="no-print text-sm underline"
        >
          Înapoi la rezultate
        </Link>
      </div>
      <div className="no-print flex flex-wrap items-center gap-2">
        <label className="mr-auto flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyDiff}
            onChange={(e) => setOnlyDiff(e.target.checked)}
            className="size-4"
          />
          Arată doar diferențele
        </label>
        <PrintButton className={btnGhost} />
        <ShareButton className={btnGhost} />
      </div>
      <p className="print-only text-sm">
        Comparație AlegeMasina. Prețuri carburant (lei/l): benzină{" "}
        {assumptions.fuelPrice.benzina}, motorină{" "}
        {assumptions.fuelPrice.motorina}, GPL {assumptions.fuelPrice.gpl}; RCA{" "}
        {assumptions.insuranceYear}, impozit {assumptions.roadTaxYear},
        întreținere {assumptions.maintenanceYear} lei/an. Toate valorile sunt
        orientative; verifică întotdeauna cu vânzătorul.
      </p>
      {mixedCycles(cols.map((c) => c.engine)) && (
        <p
          role="note"
          className="border-accent/50 rounded-lg border p-3 text-sm"
        >
          {MIXED_CYCLES_NOTE}
        </p>
      )}
      <div
        className={`${card} print-table overflow-x-auto p-0`}
        tabIndex={0}
        role="region"
        aria-label="Tabel comparație"
      >
        <table className="w-full min-w-[32rem] text-left text-sm">
          <caption className="sr-only">Comparație modele</caption>
          <thead>
            <tr className="border-line border-b">
              <th scope="col" className="p-3">
                <span className="sr-only">Criteriu</span>
              </th>
              {cols.map((c) => (
                <th key={c.m.id} scope="col" className="p-3 align-top">
                  <Morph name={`body-${c.m.id}`}>
                    <BodyIcon
                      body={c.m.body}
                      className="text-accent-text mb-2 h-12 w-28"
                    />
                  </Morph>
                  <Link
                    href={`/masini/${c.m.id}/?${query}`}
                    className="font-display text-xl font-bold hover:underline"
                  >
                    <Morph name={`title-${c.m.id}`}>
                      <span className="inline-block">
                        {c.m.brand} {c.m.model}
                      </span>
                    </Morph>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => {
              const best = r.metric
                ? bestIndexes(cols.map(r.metric), r.dir ?? "min")
                : [];
              const diff = differs(cols.map(r.text));
              return (
                <tr
                  key={r.label}
                  className="border-line border-b last:border-0"
                >
                  <th scope="row" className="text-muted p-3 font-medium">
                    {r.label}
                    {diff && (
                      <span className="text-accent-text block text-xs font-normal">
                        diferă
                      </span>
                    )}
                  </th>
                  {cols.map((c, i) => (
                    <td
                      key={c.m.id}
                      className={`p-3 ${best.includes(i) ? "bg-accent/10 font-semibold" : ""}`}
                    >
                      {r.cell(c)}
                      {best.includes(i) && (
                        <span className="text-accent-text block text-xs font-normal">
                          cea mai bună valoare
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="no-print">
        <CostEditor value={assumptions} onChange={setAssumptions} />
      </div>
    </div>
  );
}
