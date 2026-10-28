import type { Metadata } from "next";
import { Suspense } from "react";
import { Compare } from "@/components/Compare";
import { Loading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Comparație",
  description:
    "Compară până la 4 modele: specificații, consum declarat cu ciclul de test și cost lunar orientativ.",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="page-title">Comparație</h1>
      <Suspense fallback={<Loading />}>
        <Compare />
      </Suspense>
    </div>
  );
}
