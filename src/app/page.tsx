import type { Metadata } from "next";
import { Suspense } from "react";
import { StepForm } from "@/components/StepForm";
import { Loading } from "@/components/ui";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Alege mașina potrivită
        </h1>
        <p className="text-muted">
          Răspunde la 4 întrebări și vezi modele second-hand populare în
          România, cu un scor simplu, motivele lui și un cost lunar orientativ.
        </p>
      </section>
      <Suspense fallback={<Loading />}>
        <StepForm />
      </Suspense>
    </div>
  );
}
