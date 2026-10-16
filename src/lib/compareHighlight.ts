/** Indexes of the best value(s) in a row; empty when fewer than 2 values exist or all are equal. */
export function bestIndexes(
  values: (number | null)[],
  dir: "min" | "max",
): number[] {
  const present = values.filter(
    (v): v is number => v !== null && Number.isFinite(v),
  );
  if (present.length < 2 || present.every((v) => v === present[0])) return [];
  const best = dir === "min" ? Math.min(...present) : Math.max(...present);
  return values.flatMap((v, i) => (v === best ? [i] : []));
}

/** True when not all displayed values are the same. */
export const differs = (values: string[]) => new Set(values).size > 1;
