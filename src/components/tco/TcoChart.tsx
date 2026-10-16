"use client";

import { useState } from "react";
import { lei } from "@/lib/labels";

/**
 * Horizontal bar chart, one series (single hue, no legend; the title names it). Values are direct-labelled in text
 * ink, every bar has a hover/focus tooltip, and the same numbers are in the table next to it.
 */
export default function TcoChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number; note?: string }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-semibold">{title}</figcaption>
      <ul role="list" className="space-y-1.5">
        {data.map((d, i) => (
          <li
            key={d.label}
            className="relative grid grid-cols-[7.5rem_1fr_auto] items-center gap-2 text-sm"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="text-muted truncate">{d.label}</span>
            <span className="relative h-4" aria-hidden>
              <span
                className="bg-chart-bar animate-grow absolute inset-y-0 left-0 rounded-r"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  minWidth: d.value > 0 ? 2 : 0,
                }}
              />
            </span>
            <button
              type="button"
              className="text-fg rounded px-1 text-right tabular-nums"
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${d.label}: ${lei(d.value)}${d.note ? `, ${d.note}` : ""}`}
            >
              {d.note ? "—" : lei(d.value)}
            </button>
            {hover === i && (
              <span
                role="tooltip"
                className="card absolute top-full right-0 z-10 mt-1 px-2 py-1 text-xs whitespace-nowrap"
              >
                {d.label}: {d.note ?? lei(d.value)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </figure>
  );
}
