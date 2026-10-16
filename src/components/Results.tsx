"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FUEL_PRICES } from "@/config/fuelPrices";
import { models } from "@/lib/data";
import { BODY_LABEL, ENERGY_LABEL, eur } from "@/lib/labels";
import { rank, relaxOptions, type RelaxKey, type Result } from "@/lib/scoring";
import { prefsFromQuery, prefsToQuery } from "@/lib/validation";
import { BodyIcon } from "./BodyIcon";
import { BrandBadge } from "./BrandBadge";
import { CostEditor } from "./CostEditor";
import { CostLine } from "./CostLine";
import { ReasonChips } from "./ReasonChips";
import { ScoreBar } from "./ScoreBar";
import { BackToForm, btnPrimary, card, Morph, Notice } from "./ui";
import { useUrlAssumptions } from "./useUrlAssumptions";

export const MAX_COMPARE = 3;

const RELAX_LABEL: Record<RelaxKey, string> = {
  fuel: "Orice combustibil",
  body: "Orice caroserie",
  seats: "Orice număr de locuri",
};

export function Results() {
  const [assumptions, setAssumptions, query] = useUrlAssumptions();
  const { prefs } = prefsFromQuery(query);
  const [selected, setSelected] = useState<string[]>([]);
  const results = useMemo(
    () => (prefs ? rank(models, prefs, assumptions) : []),
    [prefs, assumptions],
  );

  if (!prefs)
    return (
      <Notice title="Criteriile din link nu sunt valide" tone="error">
        <p className="text-muted">Completează din nou formularul.</p>
        <BackToForm />
      </Notice>
    );

  if (results.length === 0) {
    const options = relaxOptions(models, prefs);
    return (
      <Notice title="Niciun model nu se potrivește tuturor criteriilor">
        <p className="text-muted">
          Combustibilul, caroseria și numărul de locuri sunt filtre stricte.
          Relaxează unul dintre ele:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {options.map(({ key, count }) => (
            <Link
              key={key}
              className={btnPrimary}
              href={`/rezultate/?${prefsToQuery({ ...prefs, [key]: key === "seats" ? 2 : "oricare" }, new URLSearchParams(query))}`}
            >
              {RELAX_LABEL[key]} ({count})
            </Link>
          ))}
        </div>
        <BackToForm query={query.toString()} />
      </Notice>
    );
  }

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id)
        ? s.filter((x) => x !== id)
        : s.length < MAX_COMPARE
          ? [...s, id]
          : s,
    );
  const compareHref = `/compara/?${new URLSearchParams([...query, ["ids", selected.join(",")]])}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted">
          {results.length}{" "}
          {results.length === 1 ? "model potrivit" : "modele potrivite"},
          ordonate după scor
        </p>
        <BackToForm query={query.toString()} />
      </div>
      <p className="text-muted text-sm">
        Prețuri medii carburant: benzină {FUEL_PRICES.prices.benzina}, motorină{" "}
        {FUEL_PRICES.prices.motorina}, GPL {FUEL_PRICES.prices.gpl} lei/l,
        actualizate la{" "}
        <time dateTime={FUEL_PRICES.updated}>{FUEL_PRICES.updated}</time>.
        Sursa:{" "}
        <a
          href={FUEL_PRICES.source.url}
          rel="noopener nofollow"
          className="underline"
        >
          {FUEL_PRICES.source.title}
        </a>
        .
      </p>
      <CostEditor value={assumptions} onChange={setAssumptions} />
      <ol className="space-y-3">
        {results.map((r, i) => (
          <ResultCard
            key={r.model.id}
            r={r}
            position={i + 1}
            query={query}
            checked={selected.includes(r.model.id)}
            disabled={
              !selected.includes(r.model.id) && selected.length >= MAX_COMPARE
            }
            onToggle={() => toggle(r.model.id)}
          />
        ))}
      </ol>
      {selected.length > 0 && (
        <div className="border-line bg-surface-2 sticky bottom-3 flex items-center justify-between gap-3 rounded-xl border p-3 shadow-lg">
          <span className="text-sm">
            {selected.length}/{MAX_COMPARE} selectate
          </span>
          <Link
            href={compareHref}
            className={`${btnPrimary} ${selected.length < 2 ? "pointer-events-none opacity-50" : ""}`}
            aria-disabled={selected.length < 2}
          >
            Compară
          </Link>
        </div>
      )}
    </div>
  );
}

function ResultCard(p: {
  r: Result;
  position: number;
  query: URLSearchParams;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const { model: m, engine: e } = p.r;
  return (
    <li
      className={`${card} card-hover animate-rise space-y-3`}
      style={{ animationDelay: `${p.position * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <BrandBadge brand={m.brand} />
          </div>
          <h2 className="text-xl font-bold">
            <span className="text-muted">{p.position}. </span>
            <Morph name={`title-${m.id}`}>
              <span className="inline-block">
                {m.brand} {m.model}
              </span>
            </Morph>
          </h2>
          <p className="text-muted text-sm">
            {m.generation} · {m.years.from}–{m.years.to} · {BODY_LABEL[m.body]}{" "}
            · {m.seats} locuri
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Morph name={`body-${m.id}`}>
            <BodyIcon body={m.body} className="text-muted h-8 w-20" />
          </Morph>
          {m.example && (
            <span className="border-line text-muted rounded border px-1.5 py-0.5 text-xs">
              EXEMPLU
            </span>
          )}
        </div>
      </div>
      <ScoreBar score={p.r.score} />
      <ReasonChips reasons={p.r.reasons} />
      <p className="text-sm">
        Preț orientativ:{" "}
        <span className="font-semibold">
          {eur(m.price_eur.min)} – {eur(m.price_eur.max)}
        </span>
      </p>
      <p className="text-muted text-sm">
        Estimare pentru {ENERGY_LABEL[e.energy]}{" "}
        {e.cc ? `${(e.cc / 1000).toFixed(1)} ` : ""}
        {e.hp} CP, {e.consumption.value} l/100 km (declarat)
      </p>
      <CostLine cost={p.r.cost} />
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={p.checked}
            disabled={p.disabled}
            onChange={p.onToggle}
            className="size-4 accent-[var(--accent)]"
          />
          Compară
        </label>
        <Link
          href={`/masini/${m.id}/?${p.query}`}
          className="text-accent-text font-medium underline"
        >
          Detalii {m.brand} {m.model}
        </Link>
      </div>
    </li>
  );
}
