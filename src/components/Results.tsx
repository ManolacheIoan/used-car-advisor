"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FUEL_PRICES } from "@/config/fuelPrices";
import { BRANDS, models } from "@/lib/data";
import {
  BODY_LABEL,
  consumptionRange,
  consumptionText,
  ENERGY_LABEL,
  engineSummary,
  generationLabel,
  MIXED_CYCLES_NOTE,
  mixedCycles,
  priceRange,
} from "@/lib/labels";
import {
  hasPrice,
  rank,
  relaxOptions,
  type Prefs,
  type RelaxKey,
  type Result,
} from "@/lib/scoring";
import type { Body, Energy } from "@/lib/types";
import { prefsFromQuery, prefsToQuery } from "@/lib/validation";
import { BodyIcon } from "./BodyIcon";
import { BrandBadge } from "./BrandBadge";
import { CostEditor } from "./CostEditor";
import { FavoriteButton } from "./FavoriteButton";
import { CostLine } from "./CostLine";
import { ReasonChips } from "./ReasonChips";
import { ScoreBar } from "./ScoreBar";
import { ExchangeRateNote, priceNote } from "./PriceNote";
import { ShareButton } from "./ShareButton";
import { VerificationBadge } from "./VerificationBadge";
import { BackToForm, btnGhost, btnPrimary, card, Morph, Notice } from "./ui";
import { useUrlAssumptions } from "./useUrlAssumptions";

export const MAX_COMPARE = 4;

/** Plain-language button text: which filter is dropped, and what it was. */
function widenLabel(key: RelaxKey, p: Prefs): string {
  switch (key) {
    case "fuel":
      return `Arată orice combustibil, nu doar ${ENERGY_LABEL[p.fuel as Energy].toLowerCase()}`;
    case "body":
      return `Arată orice caroserie, nu doar ${BODY_LABEL[p.body as Body]}`;
    case "brand":
      return `Arată orice marcă, nu doar ${BRANDS.find(([id]) => id === p.brand)?.[1] ?? p.brand}`;
    case "seats":
      return `Arată și mașini cu mai puțin de ${p.seats} locuri`;
  }
}

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

  if (results.length === 0 && !models.some(hasPrice))
    return (
      <Notice title="Încă nu avem prețuri verificate">
        <p className="text-muted">
          Recomandările țin cont de buget, așa că includ doar modelele cu preț
          verificat. Momentan niciun model nu are preț verificat. Poți consulta
          între timp fișele tehnice ale modelelor.
        </p>
        <BackToForm query={query.toString()} />
      </Notice>
    );

  if (results.length === 0) {
    const options = relaxOptions(models, prefs);
    return (
      <Notice title="Niciun model nu se potrivește tuturor criteriilor">
        <p className="text-muted">
          Combustibilul, caroseria, marca și numărul de locuri sunt filtre
          stricte.
          {options.length > 0
            ? " Poți renunța la unul dintre ele ca să vezi modele:"
            : " Chiar și fără unul dintre ele nu apare niciun model; modifică mai multe criterii."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {options.map(({ key, count }) => (
            <Link
              key={key}
              className={btnPrimary}
              href={`/rezultate/?${prefsToQuery({ ...prefs, [key]: key === "seats" ? 2 : "oricare" }, new URLSearchParams(query))}`}
            >
              {widenLabel(key, prefs)} ({count}{" "}
              {count === 1 ? "model" : "modele"})
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <BackToForm query={query.toString()} />
          <Link href="/" className={btnGhost}>
            Resetează filtrele
          </Link>
        </div>
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
  const compareHref = (ids: string[]) =>
    `/compara/?${new URLSearchParams([...query.entries()].filter(([k]) => k !== "ids").concat([["ids", ids.join(",")]]))}`;
  const topN = results.slice(0, MAX_COMPARE).map((r) => r.model.id);

  return (
    <div className="space-y-4">
      <p className="text-muted">
        {results.length}{" "}
        {results.length === 1 ? "model potrivit" : "modele potrivite"}, ordonate
        după scor
      </p>
      <div className="flex flex-wrap gap-2">
        {results.length >= 2 && (
          <Link href={compareHref(topN)} className={btnPrimary}>
            Compară primele {topN.length}
          </Link>
        )}
        <BackToForm query={query.toString()} />
        <Link href="/" className={btnGhost}>
          Resetează filtrele
        </Link>
        <ShareButton className={btnGhost} />
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
      <p className="text-muted text-sm">
        Prețurile mașinilor sunt prețuri cerute în anunțuri, orientativ, în EUR.{" "}
        <ExchangeRateNote />
      </p>
      <CostEditor value={assumptions} onChange={setAssumptions} />
      {mixedCycles(results.map((r) => r.engine)) && (
        <p
          role="note"
          className="border-accent/50 rounded-lg border p-3 text-sm"
        >
          {MIXED_CYCLES_NOTE}
        </p>
      )}
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
            href={compareHref(selected)}
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
      className={`${card} animate-rise space-y-3`}
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
          <p className="text-sm font-medium">{generationLabel(m)}</p>
          <p className="text-muted text-sm">
            {BODY_LABEL[m.body]} · {m.seats} locuri · portbagaj {m.trunk_l} l
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Morph name={`body-${m.id}`}>
            <BodyIcon body={m.body} className="text-muted h-8 w-20" />
          </Morph>
          {m.is_demo && (
            <span className="border-line text-muted rounded border px-1.5 py-0.5 text-xs">
              DEMO
            </span>
          )}
          <VerificationBadge m={m} />
        </div>
      </div>
      <ScoreBar score={p.r.score} />
      <ReasonChips reasons={p.r.reasons} />
      <p className="text-muted text-sm">
        Motorizări: {engineSummary(m)}. Consum declarat {consumptionRange(m)}.
      </p>
      <p className="text-sm">
        Preț: <span className="font-semibold">{priceRange(m)}</span>{" "}
        <span className="text-muted">({priceNote(m.price_eur)})</span>
      </p>
      <p className="text-muted text-sm">
        Estimare pentru {ENERGY_LABEL[e.energy]} {e.cc ? `${e.cc} cm³, ` : ""}
        {e.hp} CP, {consumptionText(e)}, declarat
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
        <FavoriteButton id={m.id} label={`${m.brand} ${m.model}`} />
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
