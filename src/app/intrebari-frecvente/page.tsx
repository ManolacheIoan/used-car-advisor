import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GuideBody, GuideMeta } from "@/components/GuideBody";
import { Notice } from "@/components/ui";
import { faqPairs, visibleGuides } from "@/lib/guides";

const SLUG = "intrebari-frecvente";

export const metadata: Metadata = {
  title: "Întrebări frecvente",
  description:
    "Răspunsuri despre date, scor, prețuri cerute și confidențialitate.",
  alternates: { canonical: "/intrebari-frecvente/" },
};

export default function Page() {
  const g = visibleGuides("pagina").find((x) => x.slug === SLUG);
  return (
    <article className="max-w-3xl space-y-5">
      <Breadcrumbs
        items={[{ name: "Întrebări frecvente", href: "/intrebari-frecvente/" }]}
      />
      <h1 className="page-title">Întrebări frecvente</h1>
      {g ? (
        <>
          {g.status === "published" && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faqPairs(g.body).map((x) => ({
                    "@type": "Question",
                    name: x.q,
                    acceptedAnswer: { "@type": "Answer", text: x.a },
                  })),
                }).replace(/</g, "\\u003c"),
              }}
            />
          )}
          <GuideMeta guide={g} />
          <GuideBody guide={g} />
        </>
      ) : (
        <Notice title="Pagina este în pregătire">
          <p className="text-muted">O publicăm după revizuire.</p>
        </Notice>
      )}
    </article>
  );
}
