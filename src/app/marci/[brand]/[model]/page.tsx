import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BodyIcon } from "@/components/BodyIcon";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { models } from "@/lib/data";
import {
  BODY_LABEL,
  consumptionRange,
  engineSummary,
  generationLabel,
  priceRange,
} from "@/lib/labels";
import { EMPTY_PARAM, groupByBrand, yearsSpan } from "@/lib/taxonomy";

export const dynamicParams = false;

function find(brand: string, model: string) {
  const b = groupByBrand(models).find((x) => x.id === brand);
  const l = b?.lines.find((x) => x.slug === model);
  return b && l ? { b, l } : null;
}

export function generateStaticParams() {
  const all = groupByBrand(models).flatMap((b) =>
    b.lines.map((l) => ({ brand: b.id, model: l.slug })),
  );
  return all.length ? all : [{ brand: EMPTY_PARAM, model: EMPTY_PARAM }];
}

export async function generateMetadata({
  params,
}: PageProps<"/marci/[brand]/[model]">): Promise<Metadata> {
  const p = await params;
  const f = find(p.brand, p.model);
  if (!f) return {};
  return {
    title: `${f.b.name} ${f.l.name}: generații`,
    description: `Generațiile ${f.b.name} ${f.l.name} (${yearsSpan(f.l.generations)}): motorizări, consum declarat cu ciclul de test, costuri orientative și surse.`,
    alternates: { canonical: `/marci/${f.b.id}/${f.l.slug}/` },
  };
}

export default async function Page({
  params,
}: PageProps<"/marci/[brand]/[model]">) {
  const p = await params;
  const f = find(p.brand, p.model);
  if (!f) notFound();
  const { b, l } = f;
  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { name: "Mărci", href: "/marci/" },
          { name: b.name, href: `/marci/${b.id}/` },
          { name: l.name, href: `/marci/${b.id}/${l.slug}/` },
        ]}
      />
      <h1 className="page-title">
        {b.name} {l.name}
      </h1>
      <p className="text-muted">
        {l.generations.length}{" "}
        {l.generations.length === 1 ? "generație" : "generații"} în catalog,
        produse între {yearsSpan(l.generations)}.
      </p>
      <ol className="space-y-3">
        {l.generations.map((m) => (
          <li
            key={m.id}
            className="card card-hover flex items-start justify-between gap-3 p-4"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold">
                <Link href={`/masini/${m.id}/`} className="hover:underline">
                  {generationLabel(m)}
                </Link>
              </h2>
              <p className="text-muted text-sm">
                {BODY_LABEL[m.body]} · {m.seats} locuri · portbagaj {m.trunk_l}{" "}
                l
              </p>
              <p className="text-muted text-sm">
                {engineSummary(m)} · consum declarat {consumptionRange(m)}
              </p>
              <p className="text-sm">Preț: {priceRange(m)}</p>
            </div>
            <BodyIcon body={m.body} className="text-muted h-8 w-20 shrink-0" />
          </li>
        ))}
      </ol>
    </div>
  );
}
