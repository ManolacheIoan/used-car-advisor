import Link from "next/link";
import { models } from "@/lib/data";
import { lei, USAGE_LABEL } from "@/lib/labels";
import { scenarioResults } from "@/lib/scenarios";
import { prefsToQuery } from "@/lib/validation";
import { card } from "./ui";

/** Server component: rendered at build time. */
export function Scenarios() {
  const scenarios = scenarioResults(models);
  return (
    <section aria-labelledby="sc-h" className="space-y-3">
      <h2 id="sc-h" className="text-lg font-semibold">
        Exemple concrete
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {scenarios.map((s) => {
          const q = prefsToQuery(s.prefs).toString();
          return (
            <li key={s.id} className={`${card} flex flex-col gap-3`}>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-muted text-xs">
                {USAGE_LABEL[s.prefs.usage]} ·{" "}
                {s.prefs.kmYear.toLocaleString("ro-RO")} km/an · minim{" "}
                {s.prefs.seats} locuri
              </p>
              {s.results.length > 0 ? (
                <ol className="space-y-1 text-sm">
                  {s.results.map((r) => (
                    <li key={r.model.id} className="flex justify-between gap-2">
                      <span>
                        {r.model.brand} {r.model.model} {r.model.generation}
                      </span>
                      <span className="text-muted tabular-nums">
                        {r.score}/100 · ~{lei(r.cost.total)}/lună
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted text-sm">
                  Încă nu există modele verificate pentru acest scenariu.
                  Rezultatele apar aici după ce datele sunt confirmate.
                </p>
              )}
              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link href={`/?${q}`} className="text-accent-text underline">
                  Deschide formularul precompletat
                </Link>
                {s.results.length > 0 && (
                  <Link href={`/rezultate/?${q}`} className="underline">
                    Toate rezultatele
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
