import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandBadge } from "@/components/BrandBadge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { models } from "@/lib/data";
import { BODY_LABEL } from "@/lib/labels";
import { EMPTY_PARAM, groupByBrand, yearsSpan } from "@/lib/taxonomy";

export const dynamicParams = false;
const brands = () => groupByBrand(models);

export function generateStaticParams() {
  const b = brands();
  return b.length ? b.map((x) => ({ brand: x.id })) : [{ brand: EMPTY_PARAM }];
}

export async function generateMetadata({
  params,
}: PageProps<"/marci/[brand]">): Promise<Metadata> {
  const id = (await params).brand;
  const b = brands().find((x) => x.id === id);
  if (!b) return {};
  return {
    title: `${b.name}: modele și generații`,
    description: `Generațiile ${b.name} din catalog (${yearsSpan(b.lines.flatMap((l) => l.generations))}), cu specificații, costuri și surse.`,
    alternates: { canonical: `/marci/${b.id}/` },
  };
}

export default async function Page({ params }: PageProps<"/marci/[brand]">) {
  const id = (await params).brand;
  const b = brands().find((x) => x.id === id);
  if (!b) notFound();
  const all = b.lines.flatMap((l) => l.generations);
  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { name: "Mărci", href: "/marci/" },
          { name: b.name, href: `/marci/${b.id}/` },
        ]}
      />
      <header className="space-y-2">
        <BrandBadge brand={b.name} size="lg" />
        <h1 className="text-3xl font-bold tracking-tight">{b.name}</h1>
        {/* Original intro generated only from catalog data (no marketing claims). */}
        <p className="text-muted">
          În catalog sunt {b.lines.length}{" "}
          {b.lines.length === 1 ? "model" : "modele"} {b.name}, în total{" "}
          {all.length} {all.length === 1 ? "generație" : "generații"} produse
          între {yearsSpan(all)}. Alege un model ca să vezi generațiile,
          motorizările, consumul declarat (cu ciclul de test) și costul lunar
          orientativ.
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {b.lines.map((l) => (
          <li key={l.slug} className="card card-hover p-4">
            <h2 className="text-lg font-bold">
              <Link
                href={`/marci/${b.id}/${l.slug}/`}
                className="hover:underline"
              >
                {b.name} {l.name}
              </Link>
            </h2>
            <p className="text-muted text-sm">
              {l.generations.length}{" "}
              {l.generations.length === 1 ? "generație" : "generații"} ·{" "}
              {yearsSpan(l.generations)} ·{" "}
              {[...new Set(l.generations.map((g) => BODY_LABEL[g.body]))].join(
                ", ",
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
