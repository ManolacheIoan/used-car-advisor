"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  facets,
  filterModels,
  filtersFromQuery,
  filtersToQuery,
  modelSlug,
  paginate,
  SORTS,
  sortModels,
  type CatalogFilters,
  type Sort,
} from "@/lib/catalog";
import { BRANDS, models } from "@/lib/data";
import {
  BODY_LABEL,
  consumptionRange,
  ENERGY_LABEL,
  engineSummary,
  generationLabel,
  priceRange,
} from "@/lib/labels";
import { brandId } from "@/lib/brand";
import type { CarModel } from "@/lib/types";
import { BodyIcon } from "../BodyIcon";
import { BrandBadge } from "../BrandBadge";
import { FavoriteButton } from "../FavoriteButton";
import { priceNote } from "../PriceNote";
import { btnGhost, card, Notice } from "../ui";
import { SearchBox, useModelSearch } from "./SearchBox";

const FACETS = facets(models);
const GEARBOX_LABEL: Record<string, string> = {
  manuala: "Manuală",
  automata: "Automată",
};
const DRIVE_LABEL: Record<string, string> = {
  fata: "Față",
  spate: "Spate",
  integrala: "Integrală",
};

/** Reads filters from the URL; the static fallback renders the same view with no filters (no layout shift). */
export function CatalogFromUrl() {
  const params = useSearchParams();
  const router = useRouter();
  const filters = filtersFromQuery(new URLSearchParams(params.toString()));
  const set = (next: CatalogFilters) => {
    const q = filtersToQuery(next).toString();
    router.replace(`/catalog/${q ? `?${q}` : ""}`, { scroll: false });
  };
  return <Catalog filters={filters} onChange={set} />;
}

export function Catalog({
  filters,
  onChange = () => {},
}: {
  filters: CatalogFilters;
  onChange?: (f: CatalogFilters) => void;
}) {
  const fuse = useModelSearch(models);
  const matchIds = useMemo(
    () =>
      filters.q ? new Set(fuse.search(filters.q).map((r) => r.item.id)) : null,
    [filters.q, fuse],
  );
  const result = paginate(
    sortModels(filterModels(models, filters, matchIds), filters.sort),
    filters.page,
  );
  const update = (patch: Partial<CatalogFilters>) =>
    onChange({ ...filters, page: 1, ...patch });
  const n = activeFilterCount(filters);
  const [showFilters, setShowFilters] = useState(false);

  const modelOptions = useMemo(() => {
    const list = models.filter(
      (m) => !filters.brand || brandId(m.brand) === filters.brand,
    );
    return [
      ...new Map(
        list.map((m) => [modelSlug(m.model), `${m.brand} ${m.model}`]),
      ),
    ].sort((a, b) => a[1].localeCompare(b[1], "ro"));
  }, [filters.brand]);

  if (models.length === 0)
    return (
      <Notice title="Catalogul public nu are încă modele verificate">
        <p className="text-muted">
          Modelele apar aici după ce datele lor sunt verificate și au licență
          confirmată.
        </p>
      </Notice>
    );

  return (
    <div className="grid gap-5 md:grid-cols-[17rem_1fr]">
      <aside className="space-y-3" aria-label="Filtre">
        <SearchBox
          key={filters.q}
          models={models}
          value={filters.q}
          onSubmit={(q) => update({ q })}
        />
        <div className="card p-4">
          <button
            type="button"
            className="w-full text-left font-semibold md:pointer-events-none"
            aria-expanded={showFilters}
            aria-controls="catalog-filters"
            onClick={() => setShowFilters((v) => !v)}
          >
            Filtre{n > 0 ? ` (${n})` : ""}{" "}
            <span className="md:hidden" aria-hidden>
              {showFilters ? "▲" : "▼"}
            </span>
          </button>
          <div
            id="catalog-filters"
            className={`mt-3 space-y-3 text-sm ${showFilters ? "" : "hidden md:block"}`}
          >
            <Select
              label="Marcă"
              value={filters.brand}
              onChange={(v) => update({ brand: v, model: "" })}
              options={BRANDS}
            />
            <Select
              label="Model"
              value={filters.model}
              onChange={(v) => update({ model: v })}
              options={modelOptions}
            />
            <Select
              label="Caroserie"
              value={filters.body}
              onChange={(v) => update({ body: v as CatalogFilters["body"] })}
              options={Object.entries(BODY_LABEL)}
            />
            <Select
              label="Combustibil"
              value={filters.fuel}
              onChange={(v) => update({ fuel: v as CatalogFilters["fuel"] })}
              options={(["benzina", "motorina", "gpl"] as const).map((e) => [
                e,
                ENERGY_LABEL[e],
              ])}
            />
            <Range
              label="Ani de producție"
              min={filters.yearFrom}
              max={filters.yearTo}
              placeholder={
                FACETS.years
                  ? [String(FACETS.years.min), String(FACETS.years.max)]
                  : ["", ""]
              }
              onChange={(yearFrom, yearTo) => update({ yearFrom, yearTo })}
            />
            <Range
              label="Putere (CP)"
              min={filters.hpMin}
              max={filters.hpMax}
              onChange={(hpMin, hpMax) => update({ hpMin, hpMax })}
            />
            <NumberInput
              label="Consum declarat maxim (l/100 km)"
              value={filters.consMax}
              step={0.1}
              onChange={(consMax) => update({ consMax })}
            />
            <Select
              label="Minim locuri"
              value={filters.seats === null ? "" : String(filters.seats)}
              onChange={(v) => update({ seats: v ? Number(v) : null })}
              options={["2", "4", "5", "7"].map((s) => [s, s])}
            />
            <NumberInput
              label="Portbagaj minim (l)"
              value={filters.trunkMin}
              step={10}
              onChange={(trunkMin) => update({ trunkMin })}
            />
            {FACETS.gearbox.length > 0 && (
              <Select
                label="Cutie de viteze"
                value={filters.gearbox}
                onChange={(v) => update({ gearbox: v })}
                options={FACETS.gearbox.map((g) => [g, GEARBOX_LABEL[g] ?? g])}
              />
            )}
            {FACETS.drive.length > 0 && (
              <Select
                label="Tracțiune"
                value={filters.drive}
                onChange={(v) => update({ drive: v })}
                options={FACETS.drive.map((d) => [d, DRIVE_LABEL[d] ?? d])}
              />
            )}
            {FACETS.hasVerifiedPrice ? (
              <Range
                label="Preț verificat (€)"
                min={filters.priceMin}
                max={filters.priceMax}
                onChange={(priceMin, priceMax) =>
                  update({ priceMin, priceMax })
                }
              />
            ) : (
              <p className="text-muted text-xs">
                Filtrul de preț apare când există prețuri verificate.
              </p>
            )}
            {FACETS.gearbox.length === 0 && FACETS.drive.length === 0 && (
              <p className="text-muted text-xs">
                Cutia de viteze și tracțiunea nu au încă date cu sursă.
              </p>
            )}
            <button
              type="button"
              className={`${btnGhost} w-full`}
              onClick={() => onChange(EMPTY_FILTERS)}
              disabled={n === 0 && !filters.q}
            >
              Resetează filtrele
            </button>
          </div>
        </div>
      </aside>

      <section aria-labelledby="catalog-results" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p id="catalog-results" className="text-muted" aria-live="polite">
            {result.total} {result.total === 1 ? "generație" : "generații"}
          </p>
          <label className="text-sm">
            Sortare{" "}
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as Sort })}
              className="border-line bg-surface-2 ml-1 rounded-lg border px-2 py-1.5"
            >
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        {result.total === 0 ? (
          <Notice title="Niciun model nu se potrivește filtrelor">
            <p className="text-muted">
              Încearcă mai puține filtre sau alt text de căutare.
            </p>
            <button
              type="button"
              className={btnGhost}
              onClick={() => onChange(EMPTY_FILTERS)}
            >
              Resetează filtrele
            </button>
          </Notice>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {result.items.map((m, i) => (
              <CatalogCard key={m.id} m={m} index={i} />
            ))}
          </ul>
        )}

        {result.pages > 1 && (
          <nav
            aria-label="Paginare"
            className="flex flex-wrap items-center justify-center gap-1.5"
          >
            <PageButton
              disabled={result.page === 1}
              onClick={() => onChange({ ...filters, page: result.page - 1 })}
            >
              ‹ Înapoi
            </PageButton>
            {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
              <PageButton
                key={p}
                current={p === result.page}
                onClick={() => onChange({ ...filters, page: p })}
              >
                {p}
              </PageButton>
            ))}
            <PageButton
              disabled={result.page === result.pages}
              onClick={() => onChange({ ...filters, page: result.page + 1 })}
            >
              Înainte ›
            </PageButton>
          </nav>
        )}
      </section>
    </div>
  );
}

function CatalogCard({ m, index }: { m: CarModel; index: number }) {
  return (
    <li
      className={`${card} animate-rise flex flex-col gap-2`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <BrandBadge brand={m.brand} />
          <h2 className="text-lg leading-tight font-bold">
            <Link href={`/masini/${m.id}/`} className="hover:underline">
              {m.brand} {m.model}
            </Link>
          </h2>
          <p className="text-sm font-medium">{generationLabel(m)}</p>
        </div>
        <BodyIcon body={m.body} className="text-muted h-8 w-20 shrink-0" />
      </div>
      <p className="text-muted text-sm">
        {BODY_LABEL[m.body]} · {m.seats} locuri · portbagaj {m.trunk_l} l
      </p>
      <p className="text-muted text-sm">
        {engineSummary(m)} · consum declarat {consumptionRange(m)}
      </p>
      <p className="text-sm">
        Preț: <span className="font-semibold">{priceRange(m)}</span>
        {m.price_eur && (
          <span className="text-muted block text-xs">
            {priceNote(m.price_eur)}
          </span>
        )}
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Link
          href={`/masini/${m.id}/`}
          className="text-accent-text text-sm font-medium underline"
        >
          Detalii
        </Link>
        <FavoriteButton
          id={m.id}
          label={`${m.brand} ${m.model} ${m.generation}`}
        />
      </div>
    </li>
  );
}

function Select(p: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="block">
      <span className="font-medium">{p.label}</span>
      <select
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        className="border-line bg-surface-2 mt-1 w-full rounded-lg border px-2 py-2"
      >
        <option value="">Oricare</option>
        {p.options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

const toNum = (s: string) =>
  s.trim() === "" || !Number.isFinite(Number(s)) ? null : Number(s);

function NumberInput(p: {
  label: string;
  value: number | null;
  step: number;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="font-medium">{p.label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={p.step}
        value={p.value ?? ""}
        onChange={(e) => p.onChange(toNum(e.target.value))}
        className="border-line bg-surface-2 mt-1 w-full rounded-lg border px-2 py-2"
      />
    </label>
  );
}

function Range(p: {
  label: string;
  min: number | null;
  max: number | null;
  placeholder?: [string, string];
  onChange: (min: number | null, max: number | null) => void;
}) {
  return (
    <fieldset>
      <legend className="font-medium">{p.label}</legend>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <input
          type="number"
          aria-label={`${p.label}: minim`}
          placeholder={p.placeholder?.[0] ?? "minim"}
          value={p.min ?? ""}
          onChange={(e) => p.onChange(toNum(e.target.value), p.max)}
          className="border-line bg-surface-2 w-full rounded-lg border px-2 py-2"
        />
        <input
          type="number"
          aria-label={`${p.label}: maxim`}
          placeholder={p.placeholder?.[1] ?? "maxim"}
          value={p.max ?? ""}
          onChange={(e) => p.onChange(p.min, toNum(e.target.value))}
          className="border-line bg-surface-2 w-full rounded-lg border px-2 py-2"
        />
      </div>
    </fieldset>
  );
}

function PageButton(p: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  current?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={p.onClick}
      disabled={p.disabled}
      aria-current={p.current ? "page" : undefined}
      className={`min-w-10 rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ${
        p.current
          ? "bg-accent text-on-accent border-accent font-semibold"
          : "border-line hover:bg-surface-2"
      }`}
    >
      {p.children}
    </button>
  );
}
