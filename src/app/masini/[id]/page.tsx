import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BodyIcon } from "@/components/BodyIcon";
import { BrandBadge } from "@/components/BrandBadge";
import { DetailCost } from "@/components/DetailCost";
import { card } from "@/components/ui";
import { getModel, models } from "@/lib/data";
import { BODY_LABEL, ENERGY_LABEL, eur } from "@/lib/labels";
import {
  isIndexable,
  modelDescription,
  modelJsonLd,
  modelTitle,
} from "@/lib/seo";
import { OG_IMAGE, SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return models.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/masini/[id]">): Promise<Metadata> {
  const m = getModel((await params).id);
  if (!m) return {};
  const url = `/masini/${m.id}/`;
  return {
    title: modelTitle(m),
    description: modelDescription(m),
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: modelTitle(m),
      description: modelDescription(m),
      locale: "ro_RO",
      siteName: SITE.name,
      images: [OG_IMAGE],
    },
    robots: isIndexable(m) ? undefined : { index: false },
  };
}

export default async function Page({ params }: PageProps<"/masini/[id]">) {
  const m = getModel((await params).id);
  if (!m) notFound();
  const jsonLd = JSON.stringify(modelJsonLd(m)).replace(/</g, "\\u003c");

  return (
    <article className="space-y-6">
      {isIndexable(m) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      {m.example && (
        <p role="note" className="border-accent rounded-lg border p-3 text-sm">
          EXEMPLU: model fictiv folosit doar pentru demonstrație. Datele nu
          descriu o mașină reală.
        </p>
      )}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <BrandBadge brand={m.brand} size="lg" />
          <h1 className="text-2xl font-bold tracking-tight">
            {m.brand} {m.model}
          </h1>
          <p className="text-muted">
            {m.generation} · {m.years.from}–{m.years.to}
          </p>
        </div>
        <BodyIcon
          body={m.body}
          className="text-accent-text h-14 w-36 shrink-0"
        />
      </header>

      <dl className={`${card} grid grid-cols-2 gap-3 text-sm sm:grid-cols-4`}>
        {[
          ["Caroserie", BODY_LABEL[m.body]],
          ["Locuri", m.seats],
          ["Portbagaj", `${m.trunk_l} l`],
          [
            "Preț orientativ",
            `${eur(m.price_eur.min)} – ${eur(m.price_eur.max)}`,
          ],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-muted">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted text-sm">
        Prețul este un interval aproximativ pentru piața second-hand, stabilit
        la <time dateTime={m.price_eur.set_on}>{m.price_eur.set_on}</time>.
        Verifică întotdeauna cu vânzătorul.
      </p>

      <section aria-labelledby="eng-h" className="space-y-2">
        <h2 id="eng-h" className="text-lg font-semibold">
          Motorizări
        </h2>
        <div className={`${card} overflow-x-auto p-0`}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-line text-muted border-b">
                <th scope="col" className="p-3 font-medium">
                  Combustibil
                </th>
                <th scope="col" className="p-3 font-medium">
                  Cilindree
                </th>
                <th scope="col" className="p-3 font-medium">
                  Putere
                </th>
                <th scope="col" className="p-3 font-medium">
                  Consum declarat
                </th>
              </tr>
            </thead>
            <tbody>
              {m.engines.map((e, i) => (
                <tr key={i} className="border-line border-b last:border-0">
                  <td className="p-3">{ENERGY_LABEL[e.energy]}</td>
                  <td className="p-3">{e.cc ? `${e.cc} cm³` : "—"}</td>
                  <td className="p-3">{e.hp} CP</td>
                  <td className="p-3">
                    {e.consumption.value} {e.consumption.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Suspense>
        <DetailCost engines={m.engines} />
      </Suspense>

      <section aria-labelledby="src-h" className="space-y-2 text-sm">
        <h2 id="src-h" className="text-lg font-semibold">
          Surse
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          {m.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} rel="noopener nofollow" className="underline">
                {s.title}
              </a>{" "}
              <span className="text-muted">(accesat {s.accessed})</span>
            </li>
          ))}
        </ul>
        <p className="text-muted">
          Ai găsit o greșeală? Scrie-ne la{" "}
          <a
            className="underline"
            href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Corectură: ${m.id}`)}`}
          >
            {SITE.contactEmail}
          </a>
          .{" "}
          <Link href="/despre-date/" className="underline">
            Despre date și limitări
          </Link>
        </p>
      </section>
    </article>
  );
}
