"use client";

import Link from "next/link";
import { btnGhost } from "./ui";
import { MAX_COMPARE_LIST, useCompareList } from "./useLocalList";

/** Adds the model to a local compare list (max 4) and links to the comparison when ≥ 2 are selected. */
export function CompareButton({ id }: { id: string }) {
  const { list, toggle } = useCompareList();
  const on = list.includes(id);
  const full = !on && list.length >= MAX_COMPARE_LIST;
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={btnGhost}
        onClick={() => toggle(id)}
        disabled={full}
        aria-pressed={on}
      >
        {on
          ? "Scoate din comparație"
          : full
            ? `Comparație plină (${MAX_COMPARE_LIST})`
            : "Adaugă la comparație"}
      </button>
      {list.length >= 2 && (
        <Link
          href={`/compara/?ids=${list.join(",")}`}
          className="text-accent-text text-sm underline"
        >
          Compară {list.length} modele
        </Link>
      )}
    </div>
  );
}
