"use client";

import Link from "next/link";
import { useState } from "react";
import { modelsWithinBudget } from "@/lib/budget";
import { COST_NOTE, DEFAULT_ASSUMPTIONS, unsetNote } from "@/lib/cost";
import { models } from "@/lib/data";
import { consumptionText, generationLabel, lei } from "@/lib/labels";
import { CostEditor } from "./CostEditor";
import { card, Notice } from "./ui";

export function BudgetHelper() {
  const [budget, setBudget] = useState("");
  const [km, setKm] = useState("12000");
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const b = Number(budget);
  const k = Number(km);
  const ok =
    budget !== "" &&
    Number.isFinite(b) &&
    b >= 0 &&
    Number.isFinite(k) &&
    k >= 0;
  const list = ok ? modelsWithinBudget(models, b, k, assumptions) : [];
  return (
    <div className="space-y-4">
      <form
        className={`${card} grid gap-3 sm:grid-cols-2`}
        onSubmit={(e) => e.preventDefault()}
        aria-label="Buget"
      >
        <label className="text-sm">
          <span className="font-medium">
            Buget lunar pentru utilizare (lei)
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="border-line bg-surface-2 mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Kilometri pe an</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            className="border-line bg-surface-2 mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
      </form>
      <CostEditor value={assumptions} onChange={setAssumptions} />
      {!ok ? (
        <p className="text-muted text-sm">
          Introdu bugetul lunar ca să vezi modelele care se încadrează.
        </p>
      ) : list.length === 0 ? (
        <Notice title="Niciun model nu se încadrează în acest buget">
          <p className="text-muted">
            Mărește bugetul sau scade kilometrii anuali.
          </p>
        </Notice>
      ) : (
        <>
          <p className="text-muted text-sm" aria-live="polite">
            {list.length}{" "}
            {list.length === 1 ? "model se încadrează" : "modele se încadrează"}{" "}
            (cost de utilizare, {COST_NOTE}
            {unsetNote(list[0].cost) ? `; ${unsetNote(list[0].cost)}` : ""}).
            Rata de finanțare nu este inclusă; vezi{" "}
            <Link href="/calculator-finantare/" className="underline">
              calculatorul de rată
            </Link>
            .
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {list.map(({ m, engine, cost, left }) => (
              <li key={m.id} className="card card-hover p-3 text-sm">
                <Link
                  href={`/masini/${m.id}/`}
                  className="font-semibold hover:underline"
                >
                  {m.brand} {m.model}
                </Link>
                <span className="text-muted block">{generationLabel(m)}</span>
                <span className="block">
                  ~{lei(cost.total)}/lună{" "}
                  <span className="text-muted">· rămân {lei(left)}</span>
                </span>
                <span className="text-muted block text-xs">
                  {consumptionText(engine)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
