import Image from "next/image";
import assets from "@/data/brandAssets.json";
import { brandId } from "@/lib/brand";

const FILES = assets as Record<string, string>;

/**
 * Official brand file if the owner added public/brands/<brand-id>.svg|png (after checking the usage terms);
 * otherwise an original text badge. Never draws or approximates a logo.
 */
export function BrandBadge({
  brand,
  size = "sm",
}: {
  brand: string;
  size?: "sm" | "lg";
}) {
  const file = FILES[brandId(brand)];
  const h = size === "lg" ? "h-8" : "h-6";
  if (file)
    return (
      <Image
        src={file}
        alt={brand}
        className={`${h} w-auto max-w-24 object-contain`}
        height={32}
        width={96}
      />
    );
  return (
    <span
      className={`inline-flex ${h} border-line bg-surface-2 text-muted items-center rounded-md border px-2 text-[0.7rem] font-bold tracking-[0.14em] uppercase`}
    >
      {brand}
    </span>
  );
}
