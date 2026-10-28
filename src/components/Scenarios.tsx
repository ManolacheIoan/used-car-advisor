import Link from "next/link";
import { models } from "@/lib/data";
import { IS_DEMO } from "@/lib/mode";
import { lei, USAGE_LABEL } from "@/lib/labels";
import { scenarioResults } from "@/lib/scenarios";
import { prefsToQuery } from "@/lib/validation";
import { card } from "./ui";

/** Server component: rendered at build time. */
export function Scenarios() {
  // Demo builds show the demo catalog (clearly bannered, or the local showcase); public builds use verified rows only.
  const scenarios = scenarioResults(models, undefined, {
    includeDemo: IS_DEMO,
  });
  return (
    <section aria-labelledby="sc-h" className="reveal space-y-4">
      <div>
        <p className="eyebrow">Scenarii</p>
        <h2 id="sc-h" className="font-display text-3xl font-bold uppercase">
          Exemple concrete
        </h2>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {scenarios.map((s) => {
          const q = prefsToQuery(s.prefs).toString();
          return (
            <li
              key={s.id}
              className={`${card} card-hover flex flex-col gap-3 p-5`}
            >
              <h3 className="font-display text-xl leading-tight font-bold">
                {s.title}
              </h3>
              <p className="text-muted text-xs">
                {USAGE_LABEL[s.prefs.usage]} ·{" "}
                {s.prefs.kmYear.toLocaleString("ro-RO")} km/an · minim{" "}
                {s.prefs.seats} locuri
              </p>
              {s.results.length > 0 ? (
                <ol className="space-y-2 text-sm">
                  {s.results.map((r, i) => (
                    <li
                      key={r.model.id}
                      className="bg-surface-2/60 flex items-center gap-3 rounded-xl px-3 py-2"
                    >
                      <span
                        className={`font-display grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${i === 0 ? "bg-accent text-on-accent" : "border-line border"}`}
                      >
                        {r.score}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {r.model.brand} {r.model.model}
                        </span>
                        <span className="text-muted block text-xs">
                          {r.model.generation} · ~{lei(r.cost.total)}/lună
                        </span>
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
