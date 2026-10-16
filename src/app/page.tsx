import type { Metadata } from "next";
import { Suspense } from "react";
import { Scenarios } from "@/components/Scenarios";
import { StepForm, StepFormFromUrl } from "@/components/StepForm";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-4xl leading-none font-bold tracking-tight sm:text-5xl">
          Alege mașina <span className="text-accent-text">potrivită</span>
        </h1>
        <p className="text-muted">
          Răspunde la 4 întrebări și vezi modele second-hand populare în
          România, cu un scor simplu, motivele lui și un cost lunar orientativ.
        </p>
      </section>
      <Suspense fallback={<StepForm />}>
        <StepFormFromUrl />
      </Suspense>
      <Scenarios />
    </div>
  );
}
