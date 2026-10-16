import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FinanceCalculator } from "@/components/FinanceCalculator";

export const metadata: Metadata = {
  title: "Calculator rată",
  description:
    "Rata lunară orientativă (formula anuității) din preț, avans, dobândă și perioadă. Doar calcul, fără oferte.",
  alternates: { canonical: "/calculator-finantare/" },
};

export default function Page() {
  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[{ name: "Calculator rată", href: "/calculator-finantare/" }]}
      />
      <h1 className="text-3xl font-bold tracking-tight">Calculator rată</h1>
      <p className="text-muted max-w-2xl">
        Introdu valorile tale; nu avem valori implicite pentru dobândă și nu
        promovăm oferte.
      </p>
      <FinanceCalculator />
    </div>
  );
}
