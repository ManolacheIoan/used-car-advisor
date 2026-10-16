import type { CarModel } from "@/lib/types";

/**
 * Reserved sections for pros/cons and known issues. Hidden while empty; the schema only accepts claims with at
 * least two independent sources, so nothing appears until such claims exist (V2).
 */
export function V2Sections({ m }: { m: CarModel }) {
  const has =
    (m.pros?.length ?? 0) +
      (m.cons?.length ?? 0) +
      (m.known_issues?.length ?? 0) >
    0;
  if (!has) return null;
  return (
    <section
      aria-label="Avantaje, dezavantaje și probleme raportate"
      data-v2
      hidden
    >
      {/* Rendering is enabled in V2, after editorial review of each claim and its sources. */}
    </section>
  );
}
