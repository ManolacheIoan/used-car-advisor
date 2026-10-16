import type { Metadata } from "next";
import { Suspense } from "react";
import { Compare } from "@/components/Compare";
import { Loading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Comparație",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Comparație</h1>
      <Suspense fallback={<Loading />}>
        <Compare />
      </Suspense>
    </div>
  );
}
