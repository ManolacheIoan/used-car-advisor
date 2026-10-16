import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "AlegeMasina — Alege mașina potrivită";

export default function Image() {
  return ogImage({
    title: "Alege mașina potrivită",
    subtitle: "Scor transparent, motive și cost lunar orientativ",
  });
}
