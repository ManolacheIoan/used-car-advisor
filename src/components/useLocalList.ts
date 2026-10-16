"use client";

import { useCallback, useSyncExternalStore } from "react";
import { models } from "@/lib/data";
import { parseFavorites } from "@/lib/favorites";

const KNOWN = new Set(models.map((m) => m.id));
const EMPTY: string[] = [];
const caches = new Map<string, { raw: string | null; list: string[] }>();

/** A list of model ids in localStorage (no cookies), shared across components and tabs. */
export function useLocalList(
  key: string,
  max: number,
): {
  list: string[];
  toggle: (id: string) => void;
  add: (id: string) => void;
  set: (ids: string[]) => void;
  clear: () => void;
} {
  const event = `alegemasina:${key}`;
  const read = useCallback(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {}
    const c = caches.get(key);
    if (c && c.raw === raw) return c.list;
    const list = parseFavorites(raw, KNOWN).slice(-max);
    caches.set(key, { raw, list });
    return list;
  }, [key, max]);
  const subscribe = useCallback(
    (cb: () => void) => {
      window.addEventListener("storage", cb);
      window.addEventListener(event, cb);
      return () => {
        window.removeEventListener("storage", cb);
        window.removeEventListener(event, cb);
      };
    },
    [event],
  );
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const set = useCallback(
    (ids: string[]) => {
      try {
        localStorage.setItem(key, JSON.stringify(ids.slice(-max)));
      } catch {}
      window.dispatchEvent(new Event(event));
    },
    [key, max, event],
  );
  return {
    list,
    set,
    toggle: (id) =>
      set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]),
    add: (id) => set([...list.filter((x) => x !== id), id]),
    clear: () => set([]),
  };
}

export const COMPARE_KEY = "alegemasina:compara";
export const MAX_COMPARE_LIST = 4;
export const useCompareList = () => useLocalList(COMPARE_KEY, MAX_COMPARE_LIST);
