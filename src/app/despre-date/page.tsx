import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { EXCHANGE_RATE } from "@/config/exchangeRate";
import { FUEL_PRICES } from "@/config/fuelPrices";
import { dataUpdated } from "@/lib/data";
import { IS_DEMO } from "@/lib/mode";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Despre date și limitări",
  description:
    "De unde vin datele, ce înseamnă valorile orientative, prețurile cerute și ciclurile de test NEDC/WLTP.",
  alternates: { canonical: "/despre-date/" },
};

export default function Page() {
  return (
    <StaticPage
      title="Despre date și limitări"
      href="/despre-date/"
      reviewed={dataUpdated}
    >
      <p>
        Date actualizate la <time dateTime={dataUpdated}>{dataUpdated}</time>.
        {IS_DEMO &&
          " Aceasta este versiunea DEMO: specificațiile și prețurile sunt valori sintetice, doar pentru testare."}
      </p>
      <h2>Ce date folosim</h2>
      <p>
        Fiecare model este descris la nivel de model și generație: ani de
        producție, caroserie, motorizări (cilindree, putere, consum declarat cu
        ciclul de test), locuri și portbagaj. Fiecare grup de date are sursa,
        data accesării și licența, afișate pe pagina modelului și în{" "}
        <Link href="/surse/">Surse și atribuiri</Link>. Publicăm un model doar
        după ce îl verificăm față de surse.
      </p>
      <h2>Valori orientative</h2>
      <ul>
        <li>
          Toate cifrele sunt orientative și pot conține erori; verifică
          întotdeauna cu vânzătorul și cu surse oficiale.
        </li>
        <li>
          Prețurile sunt <strong>prețuri cerute în anunțuri</strong>, culese
          manual (minimum 10 anunțuri, cel mult 60 de zile vechime), nu prețuri
          de vânzare.
        </li>
        <li>
          Prețurile carburanților sunt medii naționale din {FUEL_PRICES.updated}{" "}
          ({FUEL_PRICES.source.title}).
          {EXCHANGE_RATE.eurRon !== null &&
            ` Cursul folosit la conversii: 1 € = ${EXCHANGE_RATE.eurRon.toLocaleString("ro-RO")} lei (${EXCHANGE_RATE.source?.title}, ${EXCHANGE_RATE.date}).`}
        </li>
        <li>
          RCA, impozitul, ITP, rovinieta și întreținerea nu au valori implicite:
          le introduci tu.
        </li>
      </ul>
      <h2>Ciclurile de test (NEDC, WLTP)</h2>
      <p>
        Consumul declarat apare cu ciclul lui de test. Valorile NEDC și WLTP nu
        se compară direct și nu le convertim; când compari modele cu cicluri
        diferite afișăm o notă. Detalii în{" "}
        <Link href="/ghiduri/nedc-vs-wltp/">NEDC vs WLTP</Link>.
      </p>
      <h2>Ce nu facem</h2>
      <ul>
        <li>
          Nu evaluăm fiabilitatea și nu publicăm „probleme cunoscute” fără cel
          puțin două surse independente.
        </li>
        <li>
          Nu preluăm date din site-uri de anunțuri și nu copiem texte sau
          imagini.
        </li>
        <li>
          Nu avem conturi, cookies sau trackere (vezi{" "}
          <Link href="/confidentialitate/">Confidențialitate</Link>).
        </li>
      </ul>
      <h2>Corecturi</h2>
      <p>
        Scrie-ne la{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> (detalii
        în <Link href="/contact/">Contact</Link>).
      </p>
    </StaticPage>
  );
}
