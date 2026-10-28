import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Instrumente",
  description:
    "Recomandări, catalog, comparație, cost total, rată și buget lunar: instrumente orientative pentru alegerea mașinii.",
  alternates: { canonical: "/instrumente/" },
};

const TOOLS = [
  [
    "/",
    "Recomandări",
    "4 întrebări, apoi o listă ordonată după un scor transparent.",
  ],
  ["/catalog/", "Catalog", "Toate generațiile, cu filtre și căutare."],
  ["/compara/", "Comparație", "Până la 4 modele, cu diferențele evidențiate."],
  [
    "/calculator-cost/",
    "Cost total",
    "Carburant, RCA, impozit, ITP, rovinietă, întreținere și depreciere.",
  ],
  [
    "/calculator-finantare/",
    "Calculator rată",
    "Rata lunară cu formula anuității, fără oferte.",
  ],
  [
    "/buget/",
    "Buget lunar",
    "Ce modele se încadrează după costul de utilizare.",
  ],
  [
    "/favorite/",
    "Favorite și recente",
    "Liste salvate doar în browserul tău, cu export.",
  ],
] as const;

export default function Page() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ name: "Instrumente", href: "/instrumente/" }]} />
      <h1 className="page-title">Instrumente</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {TOOLS.map(([href, title, d]) => (
          <li key={href}>
            <Link href={href} className="card card-hover block h-full p-4">
              <span className="font-semibold">{title}</span>
              <span className="text-muted mt-1 block text-sm">{d}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
