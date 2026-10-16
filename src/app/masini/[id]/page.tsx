import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CompareButton } from "@/components/CompareButton";
import { FaqBlock } from "@/components/FaqBlock";
import { V2Sections } from "@/components/V2Sections";
import { brandId } from "@/lib/brand";
import { modelSlug } from "@/lib/catalog";
import { modelFaq } from "@/lib/faq";
import { similarModels } from "@/lib/similar";
import { suitability } from "@/lib/suitability";
import { BodyIcon } from "@/components/BodyIcon";
import { BrandBadge } from "@/components/BrandBadge";
import { DetailCost } from "@/components/DetailCost";
import { ExchangeRateNote, priceNote } from "@/components/PriceNote";
import { VerificationBadge } from "@/components/VerificationBadge";
import { FavoriteButton } from "@/components/FavoriteButton";
import { card, Morph } from "@/components/ui";
import { dataUpdated, getModel, models } from "@/lib/data";
import {
  BODY_LABEL,
  consumptionRange,
  consumptionText,
  ENERGY_LABEL,
  generationLabel,
  MIXED_CYCLES_NOTE,
  mixedCycles,
  priceRange,
} from "@/lib/labels";
import {
  isIndexable,
  modelDescription,
  modelJsonLd,
  modelOverview,
  modelTitle,
} from "@/lib/seo";
import { OG_IMAGE, SITE } from "@/lib/site";
import { EMPTY_PARAM } from "@/lib/taxonomy";

export const dynamicParams = false;

export function generateStaticParams() {
  return models.length
    ? models.map((m) => ({ id: m.id }))
    : [{ id: EMPTY_PARAM }];
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
  const similar = similarModels(m, models);

  return (
    <article className="space-y-6">
      <Breadcrumbs
        items={[
          { name: "Mărci", href: "/marci/" },
          { name: m.brand, href: `/marci/${brandId(m.brand)}/` },
          {
            name: m.model,
            href: `/marci/${brandId(m.brand)}/${modelSlug(m.model)}/`,
          },
          { name: `Generația ${m.generation}`, href: `/masini/${m.id}/` },
        ]}
      />
      {isIndexable(m) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      {m.is_demo && (
        <p role="note" className="border-accent rounded-lg border p-3 text-sm">
          DEMO: specificațiile și prețul acestui model sunt valori sintetice,
          generate pentru testare. Doar marca, modelul, generația, anii și
          caroseria provin din sursa listată.
        </p>
      )}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <BrandBadge brand={m.brand} size="lg" />
          <h1 className="text-3xl font-bold tracking-tight">
            <Morph name={`title-${m.id}`}>
              <span className="inline-block">
                {m.brand} {m.model}
              </span>
            </Morph>
          </h1>
          <p className="text-lg font-medium">{generationLabel(m)}</p>
          <VerificationBadge m={m} />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Morph name={`body-${m.id}`}>
            <BodyIcon
              body={m.body}
              className="text-accent-text h-14 w-36 shrink-0"
            />
          </Morph>
          <FavoriteButton id={m.id} label={`${m.brand} ${m.model}`} />
        </div>
      </header>
      <CompareButton id={m.id} />

      <p className="text-muted">{modelOverview(m)}</p>

      <dl className={`${card} grid grid-cols-2 gap-3 text-sm sm:grid-cols-4`}>
        {[
          ["Generație", m.generation],
          ["Ani de producție", `${m.years.from}–${m.years.to}`],
          ["Caroserie", BODY_LABEL[m.body]],
          ["Locuri", m.seats],
          ["Portbagaj", `${m.trunk_l} l`],
          ["Consum declarat", consumptionRange(m)],
          ["Motorizări în date", m.engines.length],
          ["Preț orientativ", priceRange(m)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-muted">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted text-sm">
        {m.price_eur ? (
          <>
            Preț: {priceNote(m.price_eur)}.
            {m.price_eur.notes ? ` Notă: ${m.price_eur.notes}.` : ""} Verifică
            întotdeauna cu vânzătorul. <ExchangeRateNote />
          </>
        ) : (
          "Pentru acest model nu avem încă un preț verificat, așa că nu apare în recomandări."
        )}
      </p>

      {mixedCycles(m.engines) && (
        <p
          role="note"
          className="border-accent/50 rounded-lg border p-3 text-sm"
        >
          {MIXED_CYCLES_NOTE}
        </p>
      )}
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
                  <td className="p-3">{consumptionText(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Suspense>
        <DetailCost engines={m.engines} />
      </Suspense>

      <section aria-labelledby="fit-h" className="space-y-2">
        <h2 id="fit-h" className="text-lg font-semibold">
          Cui i se potrivește
        </h2>
        <p className="text-muted text-sm">
          După regulile transparente de utilizare (vezi{" "}
          <Link href="/metodologie/" className="underline">
            metodologia
          </Link>
          ), aplicate motorizării cu costul de utilizare cel mai mic.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {suitability(m).map((s) => (
            <li key={s.usage} className="card p-3 text-sm">
              <p className="font-semibold">
                {s.label}: {s.suits ? "potrivit" : "mai puțin potrivit"}{" "}
                <span className="text-muted font-normal">
                  ({Math.round(s.score * 100)}/100)
                </span>
              </p>
              <p className="text-muted">
                {s.reasons
                  .map((r) => (r.positive ? "✓ " : "– ") + r.text)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <V2Sections m={m} />

      {similar.length > 0 && (
        <section aria-labelledby="sim-h" className="space-y-2">
          <h2 id="sim-h" className="text-lg font-semibold">
            Modele similare
          </h2>
          <p className="text-muted text-sm">
            Aceeași caroserie, perioadă de producție apropiată.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {similar.map((x) => (
              <li key={x.id} className="card card-hover p-3 text-sm">
                <Link
                  href={`/masini/${x.id}/`}
                  className="font-semibold hover:underline"
                >
                  {x.brand} {x.model}
                </Link>
                <span className="text-muted block">{generationLabel(x)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FaqBlock items={modelFaq(m)} indexable={isIndexable(m)} />

      <section aria-labelledby="src-h" className="space-y-2 text-sm">
        <h2 id="src-h" className="text-lg font-semibold">
          Surse
        </h2>
        <p className="text-muted">
          Date actualizate la <time dateTime={dataUpdated}>{dataUpdated}</time>.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {m.sources.map((s) => (
            <li key={s.source_url}>
              <a
                href={s.source_url}
                rel="noopener nofollow"
                className="underline"
              >
                {s.source_title}
              </a>{" "}
              <span className="text-muted">
                (accesat {s.retrieved_on}; licență: {s.license})
              </span>
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
