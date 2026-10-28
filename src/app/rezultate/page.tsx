import type { Metadata } from "next";
import { Suspense } from "react";
import { Results } from "@/components/Results";
import { Loading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Recomandări",
  description:
    "Recomandări ordonate după un scor transparent, cu motivele lui și costul lunar orientativ.",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Rezultatele tale</p>
        <h1 className="page-title">Recomandări</h1>
      </div>
      <Suspense fallback={<Loading label="Se calculează recomandările…" />}>
        <Results />
      </Suspense>
    </div>
  );
}
