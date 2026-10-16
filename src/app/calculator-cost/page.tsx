import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TcoCalculator } from "@/components/tco/TcoCalculator";

export const metadata: Metadata = {
  title: "Calculator cost total",
  description:
    "Costul total de proprietate, orientativ: carburant, RCA, impozit, ITP, rovinietă, întreținere și depreciere, lunar, anual și pe 5 ani.",
  alternates: { canonical: "/calculator-cost/" },
};

export default function Page() {
  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[{ name: "Calculator cost total", href: "/calculator-cost/" }]}
      />
      <h1 className="text-3xl font-bold tracking-tight">
        Calculator cost total
      </h1>
      <p className="text-muted max-w-2xl">
        Toate valorile sunt orientative și editabile. Unde nu avem o sursă
        oficială pentru o valoare implicită, câmpul rămâne gol: completează-l
        pentru situația ta. Nu salvăm nimic.
      </p>
      <TcoCalculator />
    </div>
  );
}
