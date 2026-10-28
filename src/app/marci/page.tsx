import type { Metadata } from "next";
import { BrandCard } from "@/components/BrandCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Notice } from "@/components/ui";
import { models } from "@/lib/data";
import { groupByBrand } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Mărci",
  description: "Mărcile din catalog, cu modelele și generațiile lor.",
  alternates: { canonical: "/marci/" },
};

export default function Page() {
  const brands = groupByBrand(models);
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ name: "Mărci", href: "/marci/" }]} />
      <h1 className="page-title">Mărci</h1>
      {brands.length === 0 ? (
        <Notice title="Încă nu există mărci cu modele verificate" />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {brands.map((b) => (
            <BrandCard key={b.id} b={b} />
          ))}
        </ul>
      )}
    </div>
  );
}
