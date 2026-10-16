"use client";

import { FAVORITES_KEY, MAX_FAVORITES } from "@/lib/favorites";
import { useLocalList } from "./useLocalList";

/** Favorites shared across components and tabs (localStorage, no cookies). Empty during prerender. */
export function useFavorites(): [string[], (id: string) => void] {
  const { list, toggle } = useLocalList(FAVORITES_KEY, MAX_FAVORITES);
  return [list, toggle];
}
