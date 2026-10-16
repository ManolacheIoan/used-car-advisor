import type { Metadata } from "next";
import { dataUpdated } from "@/lib/data";
import { BUDGET_TOLERANCE, WEIGHTS } from "@/lib/scoring";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Despre date și limitări",
  description:
    "De unde vin datele, cum se calculează scorul și costul lunar, și ce limitări are AlegeMasina.",
  alternates: { canonical: "/despre-date/" },
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function Page() {
  return (
    <article className="[&_p]:text-muted [&_ul]:text-muted max-w-none space-y-5 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      <h1 className="text-2xl font-bold tracking-tight">
        Despre date și limitări
      </h1>
      <p>
        Date actualizate la <time dateTime={dataUpdated}>{dataUpdated}</time>.
      </p>

      <h2>Ce date folosim</h2>
      <p>
        Fiecare model este descris la nivel de model și generație, nu de anunț
        individual: ani de fabricație, caroserie, motorizări (cilindree, putere,
        consum declarat), locuri, volum portbagaj și un interval aproximativ de
        preț second-hand în euro, cu data la care a fost stabilit. Fiecare model
        are cel puțin o sursă publică, afișată pe pagina lui. Nu copiem texte
        sau imagini de pe alte site-uri.
      </p>

      <h2>Cum se calculează scorul</h2>
      <ul>
        <li>
          Combustibilul, caroseria, marca și numărul minim de locuri sunt filtre
          stricte: modelele care nu se potrivesc nu apar.
        </li>
        <li>
          Potrivire cu bugetul ({pct(WEIGHTS.budget)}): cât din intervalul de
          preț se suprapune cu bugetul tău; peste sau sub buget, scorul scade
          până la zero la o diferență de {pct(BUDGET_TOLERANCE)} din bugetul
          maxim.
        </li>
        <li>
          Cost lunar estimat ({pct(WEIGHTS.cost)}): comparat cu celelalte modele
          potrivite.
        </li>
        <li>
          Potrivire cu utilizarea ({pct(WEIGHTS.usage)}): reguli simple
          (caroserie, consum, putere, portbagaj).
        </li>
        <li>Nu evaluăm fiabilitatea sau calitatea modelelor.</li>
      </ul>

      <h2>Costul lunar</h2>
      <p>
        Carburant (km pe an × consum declarat × preț) plus RCA, impozit și
        întreținere împărțite la 12. Toate ipotezele pot fi modificate pe pagina
        de rezultate. Consumul real este de obicei mai mare decât cel declarat.
        Rezultatul este orientativ.
      </p>

      <h2>Prețuri</h2>
      <p>
        Prețurile sunt prețuri cerute în anunțuri (nu prețuri de vânzare),
        culese manual, orientative, în EUR. Pentru fiecare model afișăm
        intervalul, numărul de anunțuri consultate (minimum 10) și data
        culegerii (cel mult 60 de zile în urmă la import). Modelele fără preț
        verificat nu apar în recomandări. Cursul EUR/RON, când este afișat, are
        data și sursa lui; nu convertim prețurile.
      </p>

      <h2>Consum: cicluri de test (NEDC, WLTP)</h2>
      <p>
        Consumul afișat este valoarea declarată de producător, exact cum apare
        în sursă, împreună cu ciclul de test: NEDC (vechi, folosit până în jurul
        anului 2018) sau WLTP (mai nou, de obicei cu valori mai mari pentru
        aceeași mașină). Când ciclul nu e cunoscut, scrie „ciclu necunoscut”.
      </p>
      <ul>
        <li>
          Nu convertim valorile între cicluri și nu le „normalizăm” cu factori
          estimați.
        </li>
        <li>
          Scorul și costul lunar folosesc valoarea declarată, așa cum este.
        </li>
        <li>
          Când modelele afișate sau comparate au consumuri din cicluri diferite,
          pagina afișează o notă: valorile nu sunt direct comparabile.
        </li>
      </ul>

      <h2>Limitări</h2>
      <ul>
        <li>
          Prețurile și costurile sunt aproximative. Verifică întotdeauna cu
          vânzătorul.
        </li>
        <li>
          Starea fiecărei mașini contează mai mult decât modelul. Fă o
          verificare tehnică înainte de cumpărare.
        </li>
        <li>
          Impozitul și asigurarea depind de localitate, cilindree și profilul
          tău; valorile implicite sunt generice.
        </li>
      </ul>

      <h2>Confidențialitate</h2>
      <p>
        Nu avem cont, bază de date, cookies sau trackere. Răspunsurile tale
        rămân în adresa paginii, în browser. Alegerea temei și lista de favorite
        sunt păstrate doar local, în browser (localStorage).
      </p>

      <h2>Corecturi</h2>
      <p>
        Ai găsit o greșeală? Scrie-ne la{" "}
        <a className="text-fg underline" href={`mailto:${SITE.contactEmail}`}>
          {SITE.contactEmail}
        </a>
        .
      </p>
    </article>
  );
}
