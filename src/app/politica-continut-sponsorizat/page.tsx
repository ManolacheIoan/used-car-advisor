import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Politica pentru conținut sponsorizat",
  description:
    "Momentan nu avem conținut sponsorizat. Dacă va exista, va fi marcat clar și nu va influența scorurile.",
  alternates: { canonical: "/politica-continut-sponsorizat/" },
};

export default function Page() {
  return (
    <StaticPage
      title="Politica pentru conținut sponsorizat"
      href="/politica-continut-sponsorizat/"
      reviewed="2026-10-16"
    >
      <p>
        <strong>Stare: inactivă.</strong> În prezent nu avem conținut
        sponsorizat, linkuri afiliate sau publicitate.
      </p>
      <h2>Dacă se va schimba</h2>
      <ul>
        <li>
          Orice conținut sau link plătit va fi marcat vizibil cu „Sponsorizat”,
          chiar lângă el.
        </li>
        <li>
          Plata nu va influența scorurile, ordinea recomandărilor sau datele
          afișate.
        </li>
        <li>
          Vom actualiza această pagină și data ultimei revizuiri înainte de
          orice schimbare.
        </li>
      </ul>
    </StaticPage>
  );
}
