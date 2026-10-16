import { models } from "@/lib/data";
import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";
import { EMPTY_PARAM, groupByBrand } from "@/lib/taxonomy";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "Marcă pe AlegeMasina";

export function generateStaticParams() {
  const b = groupByBrand(models);
  return b.length ? b.map((x) => ({ brand: x.id })) : [{ brand: EMPTY_PARAM }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const id = (await params).brand;
  const b = groupByBrand(models).find((x) => x.id === id);
  return ogImage({
    title: b ? b.name : "Mărci",
    subtitle: b
      ? `${b.lines.length} modele, ${b.count} generații în catalog`
      : undefined,
  });
}
