"use client";

import { useCallback, useSyncExternalStore } from "react";
import { models } from "@/lib/data";
import { FAVORITES_KEY, parseFavorites, toggleFavorite } from "@/lib/favorites";

const KNOWN = new Set(models.map((m) => m.id));
const EVENT = "alegemasina:favorite";
let cache: { raw: string | null; list: string[] } = { raw: null, list: [] };
const EMPTY: string[] = [];

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(FAVORITES_KEY);
  } catch {}
  if (raw !== cache.raw) cache = { raw, list: parseFavorites(raw, KNOWN) };
  return cache.list;
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

/** Favorites shared across components and tabs. Empty during prerender. */
export function useFavorites(): [string[], (id: string) => void] {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => {
    try {
      localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(toggleFavorite(read(), id)),
      );
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [list, toggle];
}
