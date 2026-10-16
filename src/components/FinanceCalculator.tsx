"use client";

import { useState } from "react";
import { EXCHANGE_RATE, eurToRon } from "@/config/exchangeRate";
import { eur, lei } from "@/lib/labels";
import { loanPayment, validateLoan } from "@/lib/finance";
import { card } from "./ui";

const fields = [
  ["price", "Preț mașină", "€"],
  ["downPayment", "Avans", "€"],
  ["annualRatePct", "Dobândă anuală", "%"],
  ["months", "Perioadă", "luni"],
] as const;

/** Math only: the user enters every value. No offers, no defaults for the interest rate. */
export function FinanceCalculator() {
  const [v, setV] = useState<Record<(typeof fields)[number][0], string>>({
    price: "",
    downPayment: "",
    annualRatePct: "",
    months: "",
  });
  const input = {
    price: Number(v.price.replace(",", ".")),
    downPayment: Number((v.downPayment || "0").replace(",", ".")),
    annualRatePct: Number(v.annualRatePct.replace(",", ".")),
    months: Number(v.months),
  };
  const filled = v.price !== "" && v.annualRatePct !== "" && v.months !== "";
  const errors = filled ? validateLoan(input) : [];
  const r = filled && !errors.length ? loanPayment(input) : null;
  const ron = (n: number) => {
    const x = eurToRon(n);
    return x === null ? "" : ` (~${lei(x)})`;
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form
        className={`${card} space-y-3`}
        onSubmit={(e) => e.preventDefault()}
        aria-label="Date credit"
      >
        {fields.map(([k, label, unit]) => (
          <label key={k} className="block text-sm">
            <span className="font-medium">
              {label} <span className="text-muted font-normal">({unit})</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={k === "months" ? 1 : "any"}
              value={v[k]}
              onChange={(e) => setV((s) => ({ ...s, [k]: e.target.value }))}
              className="border-line bg-surface-2 mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        ))}
        {errors.length > 0 && (
          <ul role="alert" className="text-accent-text list-disc pl-5 text-sm">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </form>
      <section
        className={`${card} space-y-3`}
        aria-labelledby="fin-out"
        aria-live="polite"
      >
        <h2 id="fin-out" className="text-lg font-semibold">
          Rezultat (calcul matematic)
        </h2>
        {r ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Rată lunară</dt>
              <dd className="text-2xl font-bold">{eur(r.payment)}</dd>
              <dd className="text-muted">{ron(r.payment)}</dd>
            </div>
            <div>
              <dt className="text-muted">Sumă finanțată</dt>
              <dd className="font-semibold">{eur(r.principal)}</dd>
            </div>
            <div>
              <dt className="text-muted">Total dobândă</dt>
              <dd className="font-semibold">{eur(r.totalInterest)}</dd>
            </div>
            <div>
              <dt className="text-muted">Total plătit (cu avans)</dt>
              <dd className="font-semibold">{eur(r.totalPaid)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted text-sm">
            Completează prețul, dobânda și perioada.
          </p>
        )}
        <p className="text-muted text-xs">
          Formula anuității: rată = P × r / (1 − (1 + r)<sup>−n</sup>), cu r =
          dobânda anuală / 12 și n = numărul de luni.
          {EXCHANGE_RATE.eurRon !== null &&
            ` Echivalentul în lei folosește 1 € = ${EXCHANGE_RATE.eurRon.toLocaleString("ro-RO")} lei (${EXCHANGE_RATE.source?.title}, ${EXCHANGE_RATE.date}).`}
        </p>
        <p className="border-accent/50 rounded-lg border p-3 text-xs">
          Doar un calcul matematic orientativ, nu o ofertă și nici un sfat
          financiar. Ofertele reale includ comisioane, asigurări și alte costuri
          (DAE), deci costul total este de obicei mai mare. Cere oferta completă
          de la finanțator.
        </p>
      </section>
    </div>
  );
}
