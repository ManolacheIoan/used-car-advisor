import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Catalog, CatalogFromUrl } from "@/components/catalog/Catalog";
import { EMPTY_FILTERS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Catalog modele",
  description:
    "Toate generațiile din catalog, cu filtre după marcă, caroserie, combustibil, ani, putere, consum și portbagaj.",
  alternates: { canonical: "/catalog/" },
};

export default function Page() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ name: "Catalog", href: "/catalog/" }]} />
      <h1 className="text-3xl font-bold tracking-tight">Catalog modele</h1>
      <Suspense fallback={<Catalog filters={EMPTY_FILTERS} />}>
        <CatalogFromUrl />
      </Suspense>
    </div>
  );
}
