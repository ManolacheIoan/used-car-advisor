"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { COST_NOTE } from "@/lib/cost";
import { getModel, models } from "@/lib/data";
import { BODY_LABEL, ENERGY_LABEL, lei } from "@/lib/labels";
import { pickEngine, rank } from "@/lib/scoring";
import type { CarModel } from "@/lib/types";
import { prefsFromQuery } from "@/lib/validation";
import { CostEditor } from "./CostEditor";
import { MAX_COMPARE } from "./Results";
import { BackToForm, card, Notice } from "./ui";
import { useUrlAssumptions } from "./useUrlAssumptions";

export const DEFAULT_KM = 12000;

export function Compare() {
  const [assumptions, setAssumptions, query] = useUrlAssumptions();
  const picked = (query.get("ids") ?? "")
    .split(",")
    .map((id) => getModel(id))
    .filter((m): m is CarModel => !!m)
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
    return {
      m,
      score: r?.score,
      ...(r ??
        pickEngine(
          m,
          prefs?.fuel ?? "oricare",
          prefs?.kmYear ?? DEFAULT_KM,
          assumptions,
        )),
    };
  });
  const back = new URLSearchParams(query);
  back.delete("ids");

  const rows: [string, (c: (typeof cols)[number]) => ReactNode][] = [
    ["Scor", (c) => (c.score !== undefined ? `${c.score}/100` : "—")],
    [
      "Generație",
      (c) => `${c.m.generation} (${c.m.years.from}–${c.m.years.to})`,
    ],
    ["Caroserie", (c) => BODY_LABEL[c.m.body]],
    ["Locuri", (c) => c.m.seats],
    ["Portbagaj", (c) => `${c.m.trunk_l} l`],
    [
      "Preț orientativ",
      (c) => `${lei(c.m.price_ron.min)} – ${lei(c.m.price_ron.max)}`,
    ],
    [
      "Motor estimat",
      (c) => `${ENERGY_LABEL[c.engine.energy]}, ${c.engine.hp} CP`,
    ],
    [
      "Consum declarat",
      (c) => `${c.engine.consumption.value} ${c.engine.consumption.unit}`,
    ],
    [
      "Cost lunar",
      (c) => (
        <>
          <strong>~{lei(c.cost.total)}</strong>{" "}
          <span className="text-muted text-xs">{COST_NOTE}</span>
        </>
      ),
    ],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted text-sm">
          Cost calculat pentru{" "}
          {(prefs?.kmYear ?? DEFAULT_KM).toLocaleString("ro-RO")} km/an.
        </p>
        <Link
          href={prefs ? `/rezultate/?${back}` : "/"}
          className="text-sm underline"
        >
          Înapoi la rezultate
        </Link>
      </div>
      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full min-w-[32rem] text-left text-sm">
          <caption className="sr-only">Comparație modele</caption>
          <thead>
            <tr className="border-line border-b">
              <th scope="col" className="p-3">
                <span className="sr-only">Criteriu</span>
              </th>
              {cols.map((c) => (
                <th key={c.m.id} scope="col" className="p-3 align-top">
                  <Link
                    href={`/masini/${c.m.id}/?${query}`}
                    className="text-accent-text font-semibold underline"
                  >
                    {c.m.brand} {c.m.model}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, cell]) => (
              <tr key={label} className="border-line border-b last:border-0">
                <th scope="row" className="text-muted p-3 font-medium">
                  {label}
                </th>
                {cols.map((c) => (
                  <td key={c.m.id} className="p-3">
                    {cell(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CostEditor value={assumptions} onChange={setAssumptions} />
    </div>
  );
}
