import { getModel, models } from "@/lib/data";
import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";
import { EMPTY_PARAM } from "@/lib/taxonomy";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "Fișa modelului pe AlegeMasina";

export function generateStaticParams() {
  return models.length
    ? models.map((m) => ({ id: m.id }))
    : [{ id: EMPTY_PARAM }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const m = getModel((await params).id);
  if (!m) return ogImage({ title: "Alege mașina potrivită" });
  return ogImage({
    kicker: `${m.brand}`,
    title: `${m.model} · Generația ${m.generation}`,
    subtitle: `${m.years.from}–${m.years.to} · specificații, consum declarat, cost orientativ`,
  });
}
