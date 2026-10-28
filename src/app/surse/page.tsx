import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { collectAttributions, needsShareAlike } from "@/lib/attributions";
import { dataUpdated, models } from "@/lib/data";
import { IS_DEMO, IS_SHOWCASE, shownSourceTitle, shownText } from "@/lib/mode";

export const metadata: Metadata = {
  title: "Surse și atribuiri",
  description:
    "Toate sursele datelor afișate, cu licența și data accesării, generate automat din date.",
  alternates: { canonical: "/surse/" },
};

export default function Page() {
  const list = collectAttributions(models);
  return (
    <StaticPage
      title="Surse și atribuiri"
      href="/surse/"
      reviewed={dataUpdated}
    >
      <p>
        Lista este generată automat din datele{" "}
        {IS_SHOWCASE
          ? "catalogului"
          : IS_DEMO
            ? "catalogului DEMO"
            : "publicate"}{" "}
        ({models.length} modele) și din fișierele de configurare. Pentru fiecare
        sursă afișăm licența și data accesării.
      </p>
      {needsShareAlike(list) && (
        <p>
          Unele date provin din Wikipedia, sub licența{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ro">
            CC BY-SA 4.0
          </a>
          . Am preluat doar fapte (de exemplu anii de producție) și indicăm
          revizia exactă a articolului. Datele din Wikidata sunt sub{" "}
          <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.ro">
            CC0 1.0
          </a>
          .
        </p>
      )}
      <ul>
        {list.map((a) => (
          <li key={a.url + a.license}>
            <a href={a.url} rel="noopener nofollow">
              {shownSourceTitle(a.title)}
            </a>{" "}
            — {a.usedFor}; licență: {shownText(a.license)}; accesat la{" "}
            {a.retrieved_on}
            {a.models > 0
              ? `; ${a.models} ${a.models === 1 ? "model" : "modele"}`
              : ""}
          </li>
        ))}
      </ul>
      <p>
        Numele și siglele mărcilor aparțin proprietarilor lor. Acest site nu
        este afiliat cu niciun producător auto.
      </p>
    </StaticPage>
  );
}
