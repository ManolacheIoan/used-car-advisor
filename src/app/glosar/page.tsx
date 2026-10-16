import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GuideBody, GuideMeta } from "@/components/GuideBody";
import { Notice } from "@/components/ui";
import { visibleGuides } from "@/lib/guides";

const SLUG = "glosar";

export const metadata: Metadata = {
  title: "Glosar",
  alternates: { canonical: "/glosar/" },
};

export default function Page() {
  const g = visibleGuides("glosar").find((x) => x.slug === SLUG);
  return (
    <article className="max-w-3xl space-y-5">
      <Breadcrumbs items={[{ name: "Glosar", href: "/glosar/" }]} />
      <h1 className="text-3xl font-bold tracking-tight">Glosar</h1>
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
