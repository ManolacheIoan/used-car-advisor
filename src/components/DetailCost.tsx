"use client";

import { COST_NOTE, monthlyCost } from "@/lib/cost";
import { consumptionText, ENERGY_LABEL, lei } from "@/lib/labels";
import type { Engine } from "@/lib/types";
import { prefsFromQuery } from "@/lib/validation";
import { CostEditor } from "./CostEditor";
import { CountUp } from "./CountUp";
import { DEFAULT_KM } from "./Compare";
import { useUrlAssumptions } from "./useUrlAssumptions";

/** Monthly and yearly running cost per engine, from editable assumptions (orientativ). */
export function DetailCost({ engines }: { engines: Engine[] }) {
  const [assumptions, setAssumptions, query] = useUrlAssumptions();
  const km = prefsFromQuery(query).prefs?.kmYear ?? DEFAULT_KM;
  return (
    <section className="space-y-3" aria-labelledby="cost-h">
      <h2 id="cost-h" className="text-lg font-semibold">
        Cost de utilizare orientativ
      </h2>
      <p className="text-muted text-sm">
        Pentru {km.toLocaleString("ro-RO")} km/an, cu consumul declarat.{" "}
        {COST_NOTE}.
      </p>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Cost lunar și anual pe motorizare
          </caption>
          <thead>
            <tr className="border-line text-muted border-b">
              <th scope="col" className="p-3 font-medium">
                Motorizare
              </th>
              <th scope="col" className="p-3 font-medium">
                Carburant
              </th>
              <th scope="col" className="p-3 font-medium">
                Fix (RCA, impozit, întreținere)
              </th>
              <th scope="col" className="p-3 font-medium">
                Lunar
              </th>
              <th scope="col" className="p-3 font-medium">
                Anual
              </th>
            </tr>
          </thead>
          <tbody>
            {engines.map((e, i) => {
              const c = monthlyCost(e, km, assumptions);
              return (
                <tr key={i} className="border-line border-b last:border-0">
                  <th scope="row" className="p-3 font-medium">
                    {ENERGY_LABEL[e.energy]} {e.hp} CP
                    <span className="text-muted block text-xs font-normal">
                      {consumptionText(e)}
                    </span>
                  </th>
                  <td className="p-3 whitespace-nowrap">{lei(c.fuel)}</td>
                  <td className="p-3 whitespace-nowrap">
                    {lei(c.insurance + c.tax + c.maintenance)}
                  </td>
                  <td className="p-3 font-semibold whitespace-nowrap">
                    ~<CountUp value={c.total} format={lei} />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    ~{lei(c.total * 12)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <CostEditor value={assumptions} onChange={setAssumptions} />
    </section>
  );
}
