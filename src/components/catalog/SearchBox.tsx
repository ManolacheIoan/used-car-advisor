"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import type { CarModel } from "@/lib/types";

/** Fuzzy search index over brand, model and generation (client-side, no network). */
export function useModelSearch(models: CarModel[]) {
  return useMemo(
    () =>
      new Fuse(models, {
        keys: [
          "brand",
          "model",
          "generation",
          {
            name: "label",
            getFn: (m) => `${m.brand} ${m.model} ${m.generation}`,
          },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [models],
  );
}

/** Accessible combobox: suggestions link to model pages; Enter applies the text as a filter. */
export function SearchBox({
  models,
  value,
  onSubmit,
}: {
  models: CarModel[];
  value: string;
  onSubmit: (q: string) => void;
}) {
  const fuse = useModelSearch(models);
  const router = useRouter();
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const suggestions =
    text.trim().length >= 2
      ? fuse.search(text.trim(), { limit: 6 }).map((r) => r.item)
      : [];

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && suggestions[active])
        router.push(`/masini/${suggestions[active].id}/`);
      else {
        onSubmit(text.trim());
        setOpen(false);
      }
    }
  }

  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="text-sm font-medium">
        Caută marcă, model sau generație
      </label>
      <input
        id={`${id}-input`}
        type="search"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(-1);
          if (e.target.value === "") onSubmit("");
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="de exemplu: Golf, Logan, Octavia"
        className="border-line bg-surface-2 mt-1 w-full rounded-lg border px-3 py-2.5"
      />
      {open && suggestions.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="card absolute z-20 mt-1 w-full overflow-hidden p-1"
        >
          {suggestions.map((m, i) => (
            <li
              key={m.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
            >
              <Link
                href={`/masini/${m.id}/`}
                className={`block rounded-md px-3 py-2 text-sm ${i === active ? "bg-surface-2" : ""} hover:bg-surface-2`}
              >
                <span className="font-medium">
                  {m.brand} {m.model}
                </span>{" "}
                <span className="text-muted">
                  {m.generation} · {m.years.from}–{m.years.to}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
