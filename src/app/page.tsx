import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandCard } from "@/components/BrandCard";
import { Scenarios } from "@/components/Scenarios";
import { StepForm, StepFormFromUrl } from "@/components/StepForm";
import { btnGhost } from "@/components/ui";
import { models } from "@/lib/data";
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

export default function Home() {
  const brands = groupByBrand(models)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ro"))
    .slice(0, POPULAR_BRANDS);
  const guides = visibleGuides("ghid").slice(0, 3);
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-4xl leading-none font-bold tracking-tight sm:text-5xl">
          Alege mașina <span className="text-accent-text">potrivită</span>
        </h1>
        <p className="text-muted max-w-2xl">
          Răspunde la 4 întrebări și vezi modele second-hand din România, cu un
          scor transparent, motivele lui și un cost lunar orientativ. Fără
          conturi, fără cookies.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/catalog/" className={btnGhost}>
            Vezi catalogul
          </Link>
          <Link href="/marci/" className={btnGhost}>
            Toate mărcile
          </Link>
        </div>
      </section>

      <section aria-label="Căutare rapidă">
        <Suspense fallback={<StepForm />}>
          <StepFormFromUrl />
        </Suspense>
      </section>

      <Scenarios />

      {brands.length > 0 && (
        <section aria-labelledby="brands-h" className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <h2 id="brands-h" className="text-lg font-semibold">
              Mărci din catalog
            </h2>
            <Link href="/marci/" className="text-accent-text text-sm underline">
              Toate mărcile
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
        <section aria-labelledby="guides-h" className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <h2 id="guides-h" className="text-lg font-semibold">
              Ghiduri
            </h2>
            <Link
              href="/ghiduri/"
              className="text-accent-text text-sm underline"
            >
              Toate ghidurile
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/ghiduri/${g.slug}/`}
                  className="card card-hover block h-full p-4"
                >
                  <span className="font-semibold">{g.title}</span>
                  <span className="text-muted mt-1 block text-sm">
                    {g.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="verify-h" className="card space-y-3 p-5">
        <h2 id="verify-h" className="text-lg font-semibold">
          Cum verificăm datele
        </h2>
        <ol className="grid gap-3 sm:grid-cols-4">
          {VERIFY_STEPS.map(([t, d], i) => (
            <li key={t} className="space-y-1">
              <span className="text-accent-text font-display text-2xl font-bold">
                {i + 1}
              </span>
              <p className="font-semibold">{t}</p>
              <p className="text-muted text-sm">{d}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/despre-date/"
          className="text-accent-text text-sm underline"
        >
          Despre date și limitări
        </Link>
      </section>
    </div>
  );
}
