import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BudgetHelper } from "@/components/BudgetHelper";

export const metadata: Metadata = {
  title: "Ce mașină îmi permit lunar",
  description:
    "Pornind de la bugetul lunar, vezi ce modele se încadrează după costul de utilizare orientativ.",
  alternates: { canonical: "/buget/" },
};

export default function Page() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ name: "Buget lunar", href: "/buget/" }]} />
      <h1 className="page-title">Ce mașină îmi permit lunar</h1>
      <BudgetHelper />
    </div>
  );
}
