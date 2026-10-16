"use client";

import { monthlyCost } from "@/lib/cost";
import { ENERGY_LABEL, lei } from "@/lib/labels";
import type { Engine } from "@/lib/types";
import { prefsFromQuery } from "@/lib/validation";
import { CostEditor } from "./CostEditor";
import { DEFAULT_KM } from "./Compare";
import { useUrlAssumptions } from "./useUrlAssumptions";

export function DetailCost({ engines }: { engines: Engine[] }) {
  const [assumptions, setAssumptions, query] = useUrlAssumptions();
  const km = prefsFromQuery(query).prefs?.kmYear ?? DEFAULT_KM;
  return (
    <section className="space-y-3" aria-labelledby="cost-h">
      <h2 id="cost-h" className="text-lg font-semibold">
        Cost lunar orientativ
      </h2>
      <p className="text-muted text-sm">
        Pentru {km.toLocaleString("ro-RO")} km/an, cu consumul declarat.
      </p>
      <ul className="space-y-1 text-sm">
        {engines.map((e, i) => (
          <li key={i}>
            {ENERGY_LABEL[e.energy]} {e.hp} CP:{" "}
            <strong>~{lei(monthlyCost(e, km, assumptions).total)}/lună</strong>
          </li>
        ))}
      </ul>
      <CostEditor value={assumptions} onChange={setAssumptions} />
    </section>
  );
}
