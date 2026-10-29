import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandCard } from "@/components/BrandCard";
import { BrandBadge } from "@/components/BrandBadge";
import { CountInt } from "@/components/CountUp";
import { HeroCar } from "@/components/HeroCar";
import { ScoreRing } from "@/components/ScoreRing";
import { Scenarios } from "@/components/Scenarios";
import { StepForm, StepFormFromUrl } from "@/components/StepForm";
import { btnGhost, btnPrimary } from "@/components/ui";
import { FEATURED } from "@/config/featured";
import { SCENARIOS } from "@/config/scenarios";
import { DEFAULT_ASSUMPTIONS } from "@/lib/cost";
import { getModel, models } from "@/lib/data";
import { generationLabel, lei, priceRange } from "@/lib/labels";
import { IS_DEMO } from "@/lib/mode";
import { pickEngine, rank } from "@/lib/scoring";
import { prefsToQuery } from "@/lib/validation";
import { visibleGuides } from "@/lib/guides";
import { groupByBrand } from "@/lib/taxonomy";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/** "Popular" = most generations in the catalog (no external popularity data is used). */
const POPULAR_BRANDS = 8;

const VERIFY_STEPS = [
  ["Surse publice", "Fiecare câmp are sursa, data accesării și licența ei."],
  [
    "Verificare manuală",
    "Un model apare public doar după ce îl verificăm față de surse.",
  ],
  [
    "Prețuri cerute",
    "Prețurile vin din anunțuri culese manual (minimum 10), cu data culegerii.",
  ],
  [
    "Fără conversii ascunse",
    "Consumul are ciclul de test (NEDC/WLTP) și nu îl convertim.",
  ],
] as const;

/** Hero preview: the real top result of the family example (verified models only, except in demo builds). */
function heroPick() {
  const s = SCENARIOS.find((x) => x.id === "familie") ?? SCENARIOS[0];
  const pool = IS_DEMO
    ? models
    : models.filter((m) => !m.is_demo && m.verified);
  const top = rank(pool, s.prefs, DEFAULT_ASSUMPTIONS)[0];
  return top
    ? { top, q: prefsToQuery(s.prefs).toString(), title: s.title }
    : null;
}

/** Featured model card (editorial pick): local-catalog builds only; see src/config/featured.ts. */
function featuredPick() {
  if (!IS_DEMO) return null;
  const m = getModel(FEATURED.modelId);
  const est = m && pickEngine(m, "oricare", 12000, DEFAULT_ASSUMPTIONS);
  return m && est ? { m, cost: est.cost.total } : null;
}

export default function Home() {
  const all = groupByBrand(models);
  const brands = [...all]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ro"))
    .slice(0, POPULAR_BRANDS);
  const pick = heroPick();
  const featured = featuredPick();
  const guides = visibleGuides("ghid").slice(0, 3);
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 overflow-x-clip pt-2 lg:grid-cols-[1.05fr_1fr] lg:pt-8">
        <div className="animate-rise space-y-6">
          <p className="eyebrow">Mașini second-hand · România</p>
          {/* The paragraph takes the title's width (w-0 + min-w-full), so it ends under "MAȘINA" and leaves the
              road under the hero car clear. */}
          <div className="w-fit space-y-6">
            <h1 className="font-display text-5xl leading-[0.92] font-bold tracking-tight uppercase sm:text-7xl">
              Alege mașina{" "}
              <span className="text-gradient block">potrivită</span>
            </h1>
            <p className="text-muted w-0 min-w-full text-lg">
              Răspunde la 4 întrebări și vezi modele second-hand din România, cu
              un scor transparent, motivele lui și un cost lunar orientativ.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#cauta" className={btnPrimary}>
              Începe acum <span aria-hidden>→</span>
            </a>
            <Link href="/catalog/" className={btnGhost}>
              Vezi catalogul
            </Link>
            <Link href="/marci/" className={btnGhost}>
              Toate mărcile
            </Link>
          </div>
          {models.length > 0 && (
            <dl className="border-line grid max-w-md grid-cols-3 gap-4 border-t pt-5">
              {[
                ["modele", models.length],
                ["mărci", all.length],
                ["întrebări", 4],
              ].map(([k, v]) => (
                <div key={k}>
                  <dd className="font-display text-3xl font-bold">
                    <CountInt value={v as number} />
                  </dd>
                  <dt className="text-muted text-sm">{k}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="relative" aria-hidden={!pick && !featured}>
          <div className="bg-accent/20 absolute inset-x-10 top-1/3 -z-10 h-1/2 rounded-full blur-3xl" />
          <div className="px-2 sm:px-6">
            <HeroCar body={pick?.top.model.body ?? "suv"} />
          </div>
          {pick && (
            <Link
              href={`/rezultate/?${pick.q}`}
              className="card card-hover animate-rise mx-auto -mt-2 flex max-w-sm items-center gap-4 p-4 sm:mr-4 sm:ml-auto"
              style={{ animationDelay: "500ms" }}
            >
              <ScoreRing score={pick.top.score} size={68} />
              <span className="min-w-0 space-y-0.5">
                <span className="eyebrow block text-[0.65rem]">
                  Top pentru familie
                </span>
                <span className="font-display block truncate text-xl font-bold">
                  {pick.top.model.brand} {pick.top.model.model}
                </span>
                <span className="text-muted block truncate text-xs">
                  {generationLabel(pick.top.model)}
                </span>
                <span className="text-accent-text block text-sm font-semibold">
                  ~{lei(pick.top.cost.total)}/lună
                </span>
              </span>
              <span className="ml-auto hidden sm:block">
                <BrandBadge brand={pick.top.model.brand} />
              </span>
            </Link>
          )}
          {featured && (
            <Link
              href={`/masini/${featured.m.id}/`}
              className="card card-hover animate-rise mx-auto mt-3 flex max-w-sm items-center gap-4 p-4 sm:mr-4 sm:ml-auto"
              style={{ animationDelay: "650ms" }}
            >
              <span className="bg-accent text-on-accent glow grid size-[68px] shrink-0 place-items-center rounded-full">
                <svg
                  viewBox="0 0 24 24"
                  className="size-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M14 7h7v7" />
                </svg>
              </span>
              <span className="min-w-0 space-y-0.5">
                <span className="eyebrow block text-[0.65rem]">
                  {FEATURED.label}
                </span>
                <span className="font-display block truncate text-xl font-bold">
                  {featured.m.brand} {featured.m.model}
                </span>
                <span className="text-muted block truncate text-xs">
                  {generationLabel(featured.m)}
                </span>
                <span className="text-accent-text block text-sm font-semibold">
                  {priceRange(featured.m)}
                </span>
                <span className="text-muted block text-xs">
                  ~{lei(featured.cost)}/lună
                </span>
              </span>
              <span className="ml-auto hidden sm:block">
                <BrandBadge brand={featured.m.brand} />
              </span>
            </Link>
          )}
        </div>
      </section>

      <section
        id="cauta"
        aria-labelledby="cauta-h"
        className="reveal scroll-mt-24 space-y-4"
      >
        <div>
          <p className="eyebrow">Căutare rapidă</p>
          <h2
            id="cauta-h"
            className="font-display text-3xl font-bold uppercase"
          >
            4 întrebări, recomandări pe loc
          </h2>
        </div>
        <Suspense fallback={<StepForm />}>
          <StepFormFromUrl />
        </Suspense>
      </section>

      <Scenarios />

      {brands.length > 0 && (
        <section aria-labelledby="brands-h" className="reveal space-y-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="eyebrow">Explorează</p>
              <h2
                id="brands-h"
                className="font-display text-3xl font-bold uppercase"
              >
                Mărci din catalog
              </h2>
            </div>
            <Link
              href="/marci/"
              className="text-accent-text text-sm font-semibold hover:underline"
            >
              Toate mărcile →
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {brands.map((b) => (
              <BrandCard key={b.id} b={b} />
            ))}
          </ul>
        </section>
      )}

      {guides.length > 0 && (
        <section aria-labelledby="guides-h" className="reveal space-y-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="eyebrow">Înainte să cumperi</p>
              <h2
                id="guides-h"
                className="font-display text-3xl font-bold uppercase"
              >
                Ghiduri
              </h2>
            </div>
            <Link
              href="/ghiduri/"
              className="text-accent-text text-sm font-semibold hover:underline"
            >
              Toate ghidurile →
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/ghiduri/${g.slug}/`}
                  className="card card-hover group block h-full p-5"
                >
                  <span className="eyebrow mb-2 block text-[0.65rem]">
                    Ghid
                  </span>
                  <span className="font-display block text-xl font-bold">
                    {g.title}
                  </span>
                  <span className="text-muted mt-1 block text-sm">
                    {g.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-labelledby="verify-h"
        className="card reveal relative space-y-6 overflow-hidden p-6 sm:p-8"
      >
        <div className="bg-accent/10 absolute -top-24 -right-24 size-72 rounded-full blur-3xl" />
        <div>
          <p className="eyebrow">Transparență</p>
          <h2
            id="verify-h"
            className="font-display text-3xl font-bold uppercase"
          >
            Cum verificăm datele
          </h2>
        </div>
        <ol className="grid gap-6 sm:grid-cols-4">
          {VERIFY_STEPS.map(([t, d], i) => (
            <li key={t} className="border-line space-y-1 border-l pl-4">
              <span className="text-gradient font-display text-4xl font-bold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="font-semibold">{t}</p>
              <p className="text-muted text-sm">{d}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/despre-date/"
          className="text-accent-text relative text-sm font-semibold hover:underline"
        >
          Despre date și limitări →
        </Link>
      </section>
    </div>
  );
}
