"use client";

import Link from "next/link";
import { getModel } from "@/lib/data";
import { exportPayload } from "@/lib/exportList";
import { BODY_LABEL, generationLabel, priceRange } from "@/lib/labels";
import type { CarModel } from "@/lib/types";
import { BodyIcon } from "./BodyIcon";
import { BrandBadge } from "./BrandBadge";
import { FavoriteButton } from "./FavoriteButton";
import { btnGhost, btnPrimary, card, Notice } from "./ui";
import { useRecentList } from "./useLocalList";
import { useFavorites } from "./useFavorites";
import { FAVORITES_KEY, MAX_FAVORITES } from "@/lib/favorites";
import { useLocalList } from "./useLocalList";

function download(kind: "favorite" | "recente", list: CarModel[]) {
  const blob = new Blob([JSON.stringify(exportPayload(kind, list), null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `alegemasina-${kind}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const toModels = (ids: string[]) =>
  ids.map(getModel).filter((m): m is CarModel => !!m);

export function Favorites() {
  const [favIds] = useFavorites();
  const fav = useLocalList(FAVORITES_KEY, MAX_FAVORITES);
  const recent = useRecentList();
  const list = toModels(favIds);
  const recentList = toModels([...recent.list].reverse());
  const compare = list.slice(0, 4).map((m) => m.id);

  return (
    <div className="space-y-8">
      <section aria-labelledby="fav-h" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="fav-h" className="text-lg font-semibold">
            Favorite ({list.length})
          </h2>
          {list.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {list.length >= 2 && (
                <Link
                  href={`/compara/?ids=${compare.join(",")}`}
                  className={btnPrimary}
                >
                  Compară{" "}
                  {compare.length === list.length ? "favoritele" : "primele 4"}
                </Link>
              )}
              <button
                type="button"
                className={btnGhost}
                onClick={() => download("favorite", list)}
              >
                Exportă (JSON)
              </button>
              <button
                type="button"
                className={btnGhost}
                onClick={() => fav.clear()}
              >
                Șterge lista
              </button>
            </div>
          )}
        </div>
        {list.length === 0 ? (
          <Notice title="Nu ai salvat încă niciun model">
            <p className="text-muted">
              Apasă „Salvează” pe un rezultat sau pe pagina unui model.
            </p>
            <Link href="/catalog/" className={btnPrimary}>
              Deschide catalogul
            </Link>
          </Notice>
        ) : (
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
                    {generationLabel(m)} · {BODY_LABEL[m.body]} ·{" "}
                    {priceRange(m)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <BodyIcon body={m.body} className="text-muted h-7 w-16" />
                  <FavoriteButton id={m.id} label={`${m.brand} ${m.model}`} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-h" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="recent-h" className="text-lg font-semibold">
            Văzute recent ({recentList.length})
          </h2>
          {recentList.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={btnGhost}
                onClick={() => download("recente", recentList)}
              >
                Exportă (JSON)
              </button>
              <button
                type="button"
                className={btnGhost}
                onClick={() => recent.clear()}
              >
                Șterge istoricul
              </button>
            </div>
          )}
        </div>
        {recentList.length === 0 ? (
          <p className="text-muted text-sm">
            Paginile de model pe care le deschizi apar aici.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {recentList.map((m) => (
              <li key={m.id} className="card p-3 text-sm">
                <Link
                  href={`/masini/${m.id}/`}
                  className="font-semibold hover:underline"
                >
                  {m.brand} {m.model}
                </Link>
                <span className="text-muted block">{generationLabel(m)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-muted text-xs">
        Listele sunt salvate doar în acest browser (localStorage), fără cookies.
      </p>
    </div>
  );
}
