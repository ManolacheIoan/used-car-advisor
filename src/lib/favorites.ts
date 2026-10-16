/** Favorites are model ids kept in localStorage (no cookies, never sent anywhere). */
export const FAVORITES_KEY = "alegemasina:favorite";
export const MAX_FAVORITES = 50;

/** Tolerates missing, corrupted or foreign data; keeps only known ids, no duplicates. */
export function parseFavorites(
  raw: string | null,
  known: Set<string>,
): string[] {
  try {
    const v: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(v)) return [];
    return [
      ...new Set(
        v.filter((x): x is string => typeof x === "string" && known.has(x)),
      ),
    ].slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

export function toggleFavorite(list: string[], id: string): string[] {
  return list.includes(id)
    ? list.filter((x) => x !== id)
    : [...list, id].slice(-MAX_FAVORITES);
}
