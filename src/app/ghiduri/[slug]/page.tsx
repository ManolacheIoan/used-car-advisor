import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GuideBody, GuideMeta } from "@/components/GuideBody";
import { visibleGuides } from "@/lib/guides";
import { EMPTY_PARAM } from "@/lib/taxonomy";

export const dynamicParams = false;
const find = (slug: string) =>
  visibleGuides("ghid").find((g) => g.slug === slug);

export function generateStaticParams() {
  const g = visibleGuides("ghid");
  return g.length ? g.map((x) => ({ slug: x.slug })) : [{ slug: EMPTY_PARAM }];
}

export async function generateMetadata({
  params,
}: PageProps<"/ghiduri/[slug]">): Promise<Metadata> {
  const g = find((await params).slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/ghiduri/${g.slug}/` },
    robots: g.status === "draft" ? { index: false } : undefined,
  };
}

export default async function Page({ params }: PageProps<"/ghiduri/[slug]">) {
  const g = find((await params).slug);
  if (!g) notFound();
  return (
    <article className="space-y-5">
      <Breadcrumbs
        items={[
          { name: "Ghiduri", href: "/ghiduri/" },
          { name: g.title, href: `/ghiduri/${g.slug}/` },
        ]}
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{g.title}</h1>
        <p className="text-muted">{g.description}</p>
        <GuideMeta guide={g} />
      </header>
      <GuideBody guide={g} />
      <p className="text-muted border-line border-t pt-4 text-sm">
        Ghid orientativ, scris de echipa AlegeMasina. Nu reprezintă consultanță
        juridică, fiscală sau financiară.
      </p>
    </article>
  );
}
