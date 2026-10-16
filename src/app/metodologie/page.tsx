import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { USAGE_RULES } from "@/config/usageRules";
import { USAGE_LABEL } from "@/lib/labels";
import { BUDGET_TOLERANCE, MAX_RESULTS, WEIGHTS } from "@/lib/scoring";
import type { Usage } from "@/lib/types";

export const metadata: Metadata = {
  title: "Metodologie",
  description:
    "Cum calculăm scorul, costul lunar și costul total: ponderi, reguli și limite.",
  alternates: { canonical: "/metodologie/" },
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function Page() {
  return (
    <StaticPage title="Metodologie" href="/metodologie/" reviewed="2026-10-16">
      <h2>Filtre stricte</h2>
      <p>
        Combustibilul, caroseria, marca (opțional) și numărul minim de locuri
        elimină modelele care nu se potrivesc. Recomandările includ doar
        modelele cu preț verificat.
      </p>
      <h2>Scorul (0–100)</h2>
      <ul>
        <li>
          Buget: {pct(WEIGHTS.budget)}. Cât din intervalul de preț se suprapune
          cu bugetul tău; în afara bugetului, scorul scade liniar până la zero
          la o diferență de {pct(BUDGET_TOLERANCE)} din bugetul maxim.
        </li>
        <li>
          Cost lunar estimat: {pct(WEIGHTS.cost)}, comparat cu celelalte modele
          potrivite (cel mai ieftin = maximum).
        </li>
        <li>
          Potrivire cu utilizarea: {pct(WEIGHTS.usage)}, din regulile de mai
          jos.
        </li>
      </ul>
      <p>
        Afișăm cel mult {MAX_RESULTS} rezultate. Scorul nu include fiabilitatea
        sau calitatea.
      </p>
      <h2>Regulile de utilizare</h2>
      {(Object.keys(USAGE_RULES) as Usage[]).map((u) => (
        <section key={u}>
          <h3 className="font-semibold">
            {USAGE_LABEL[u]} (bază {pct(USAGE_RULES[u].base)})
          </h3>
          <ul>
            {USAGE_RULES[u].rules.map((r) => (
              <li key={r.yes}>
                +{pct(r.points)} „{r.yes}” — {r.reason}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <h2>Costul lunar</h2>
      <p>
        Carburant (km pe an × consum declarat × preț pe litru) plus RCA, impozit
        și întreținere împărțite la 12. Prețurile carburanților sunt medii
        naționale cu dată și sursă; costurile fixe le introduci tu. Consumul
        real este de obicei mai mare decât cel declarat; nu convertim între
        ciclurile de test NEDC și WLTP.
      </p>
      <h2>Costul total pe 5 ani</h2>
      <p>
        Adaugă ITP (tarif împărțit la intervalul dintre inspecții), rovinieta și
        deprecierea (preț × procent anual, convertit în lei cu cursul afișat).
        Toate valorile sunt orientative și editabile.
      </p>
      <h2>Limite</h2>
      <ul>
        <li>
          Datele tehnice sunt declarate de producători și pot diferi de la o
          versiune la alta.
        </li>
        <li>
          Prețurile sunt prețuri cerute în anunțuri, nu prețuri de vânzare.
        </li>
        <li>
          Starea fiecărei mașini contează mai mult decât modelul; verifică
          întotdeauna mașina concretă.
        </li>
      </ul>
    </StaticPage>
  );
}
