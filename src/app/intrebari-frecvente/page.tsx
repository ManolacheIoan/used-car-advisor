import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GuideBody, GuideMeta } from "@/components/GuideBody";
import { Notice } from "@/components/ui";
import { visibleGuides } from "@/lib/guides";

const SLUG = "intrebari-frecvente";

export const metadata: Metadata = {
  title: "Întrebări frecvente",
  alternates: { canonical: "/intrebari-frecvente/" },
};

export default function Page() {
  const g = visibleGuides("pagina").find((x) => x.slug === SLUG);
  return (
    <article className="space-y-5">
      <Breadcrumbs
        items={[{ name: "Întrebări frecvente", href: "/intrebari-frecvente/" }]}
      />
      <h1 className="text-3xl font-bold tracking-tight">Întrebări frecvente</h1>
      {g ? (
        <>
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
