"use client";

import { useFavorites } from "./useFavorites";

export function FavoriteButton({ id, label }: { id: string; label: string }) {
  const [list, toggle] = useFavorites();
  const on = list.includes(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={on}
      aria-label={
        on ? `Scoate ${label} din favorite` : `Salvează ${label} la favorite`
      }
      className="no-print border-line hover:border-accent inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition"
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"
          fill={on ? "var(--accent)" : "none"}
          stroke={on ? "var(--accent)" : "currentColor"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      {on ? "Salvat" : "Salvează"}
    </button>
  );
}

export function FavoritesCount() {
  const [list] = useFavorites();
  return list.length > 0 ? (
    <span className="tabular-nums"> ({list.length})</span>
  ) : null;
}
