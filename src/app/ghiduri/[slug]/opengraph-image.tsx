import { visibleGuides } from "@/lib/guides";
import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";
import { EMPTY_PARAM } from "@/lib/taxonomy";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "Ghid AlegeMasina";

export function generateStaticParams() {
  const g = visibleGuides("ghid");
  return g.length ? g.map((x) => ({ slug: x.slug })) : [{ slug: EMPTY_PARAM }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const g = visibleGuides("ghid").find((x) => x.slug === slug);
  return ogImage({ kicker: "Ghid orientativ", title: g?.title ?? "Ghiduri" });
}
