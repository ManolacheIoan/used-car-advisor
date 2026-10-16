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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Recomandări</h1>
      <Suspense fallback={<Loading label="Se calculează recomandările…" />}>
        <Results />
      </Suspense>
    </div>
  );
}
