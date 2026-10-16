import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact și corecturi",
  description: "Cum ne semnalezi o greșeală în date.",
  alternates: { canonical: "/contact/" },
};

export default function Page() {
  return (
    <StaticPage
      title="Contact și corecturi"
      href="/contact/"
      reviewed="2026-10-16"
    >
      <p>
        Ai găsit o valoare greșită, o sursă care nu mai funcționează sau o
        formulare neclară? Scrie-ne la{" "}
        <a
          href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Corectură AlegeMasina")}`}
        >
          {SITE.contactEmail}
        </a>
        .
      </p>
      <h2>Ce să incluzi</h2>
      <ul>
        <li>adresa paginii (linkul);</li>
        <li>valoarea pe care o consideri greșită și valoarea corectă;</li>
        <li>o sursă publică pe care o putem verifica.</li>
      </ul>
      <p>
        Corectăm datele după ce le verificăm și actualizăm data din „Surse și
        atribuiri”.
      </p>
    </StaticPage>
  );
}
