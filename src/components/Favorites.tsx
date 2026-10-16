"use client";

import Link from "next/link";
import { getModel } from "@/lib/data";
import { BODY_LABEL, generationLabel, priceRange } from "@/lib/labels";
import type { CarModel } from "@/lib/types";
import { BodyIcon } from "./BodyIcon";
import { BrandBadge } from "./BrandBadge";
import { FavoriteButton } from "./FavoriteButton";
import { priceNote } from "./PriceNote";
import { btnPrimary, card, Notice } from "./ui";
import { useFavorites } from "./useFavorites";

export function Favorites() {
  const [ids] = useFavorites();
  const list = ids.map(getModel).filter((m): m is CarModel => !!m);
  if (list.length === 0)
    return (
      <Notice title="Nu ai salvat încă niciun model">
        <p className="text-muted">
          Apasă „Salvează” pe un rezultat sau pe pagina unui model.
        </p>
        <Link href="/" className={btnPrimary}>
          Caută o mașină
        </Link>
      </Notice>
    );
  const compare = list.slice(0, 3).map((m) => m.id);
  return (
    <div className="space-y-3">
      {list.length >= 2 && (
        <Link
          href={`/compara/?ids=${compare.join(",")}`}
          className={btnPrimary}
        >
          Compară{" "}
          {compare.length === list.length ? "favoritele" : "primele 3 favorite"}
        </Link>
      )}
      <ul className="space-y-3">
        {list.map((m) => (
          <li
            key={m.id}
            className={`${card} card-hover flex items-center justify-between gap-3`}
          >
            <div className="min-w-0 space-y-1">
              <BrandBadge brand={m.brand} />
              <Link
                href={`/masini/${m.id}/`}
                className="block font-semibold underline"
              >
                {m.brand} {m.model}
              </Link>
              <p className="text-muted text-sm">
                {generationLabel(m)} · {BODY_LABEL[m.body]} · {priceRange(m)}
                {m.price_eur && ` (${priceNote(m.price_eur)})`}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <BodyIcon body={m.body} className="text-muted h-7 w-16" />
              <FavoriteButton id={m.id} label={`${m.brand} ${m.model}`} />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-muted text-xs">
        Lista este salvată doar în acest browser (localStorage), fără cookies.
      </p>
    </div>
  );
}
