import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Confidențialitate",
  description:
    "Ce date păstrăm: niciun cont, fără cookies sau trackere; preferințele rămân în browserul tău.",
  alternates: { canonical: "/confidentialitate/" },
};

export default function Page() {
  return (
    <StaticPage
      title="Confidențialitate"
      href="/confidentialitate/"
      reviewed="2026-10-16"
    >
      <p>
        Pe scurt: nu avem conturi, nu folosim cookies și nu folosim instrumente
        de urmărire sau de analiză.
      </p>
      <h2>Ce rămâne în browserul tău</h2>
      <ul>
        <li>tema aleasă (luminoasă sau întunecată);</li>
        <li>
          lista de favorite, lista de comparație și modelele văzute recent.
        </li>
      </ul>
      <p>
        Acestea sunt păstrate doar local, în spațiul de stocare al browserului
        (localStorage), și nu ne sunt trimise. Le poți șterge din pagina
        Favorite sau din setările browserului.
      </p>
      <h2>Ce intră în adresa paginii</h2>
      <p>
        Criteriile formularului și ipotezele de cost sunt scrise în adresa
        paginii, ca să poți distribui rezultatul. Nu le salvăm pe niciun server.
      </p>
      <h2>Găzduire</h2>
      <p>
        Site-ul este static. Furnizorul de găzduire poate păstra jurnale tehnice
        standard (de exemplu adresa IP și ora cererii) pentru funcționare și
        securitate, conform politicii lui.
      </p>
      <h2>Contact</h2>
      <p>
        Întrebări:{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </StaticPage>
  );
}
