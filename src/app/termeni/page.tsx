import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Termeni și limitarea răspunderii",
  description:
    "Informațiile sunt orientative; verifică întotdeauna mașina, prețul și costurile cu surse oficiale.",
  alternates: { canonical: "/termeni/" },
};

export default function Page() {
  return (
    <StaticPage
      title="Termeni și limitarea răspunderii"
      href="/termeni/"
      reviewed="2026-10-16"
    >
      <h2>Informații orientative</h2>
      <p>
        Datele, scorurile, prețurile și costurile de pe acest site sunt
        orientative. Pot conține erori sau pot fi depășite. Nu reprezintă o
        recomandare de cumpărare și nici consultanță juridică, fiscală sau
        financiară.
      </p>
      <h2>Verifică înainte să decizi</h2>
      <ul>
        <li>starea mașinii concrete, la un service ales de tine;</li>
        <li>prețul și condițiile direct cu vânzătorul;</li>
        <li>
          taxele, asigurarea și obligațiile legale la instituțiile competente.
        </li>
      </ul>
      <h2>Mărci și conținut</h2>
      <p>
        Numele și siglele mărcilor aparțin proprietarilor lor. Acest site nu
        este afiliat cu niciun producător auto. Textele site-ului sunt
        originale; sursele datelor sunt listate în pagina „Surse și atribuiri”.
      </p>
      <h2>Linkuri externe</h2>
      <p>
        Nu răspundem pentru conținutul site-urilor externe la care trimitem.
      </p>
    </StaticPage>
  );
}
