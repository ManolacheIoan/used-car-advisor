import { lei } from "@/lib/labels";
import { COST_NOTE, unsetNote, type MonthlyCost } from "@/lib/cost";
import { CountUp } from "./CountUp";

export function CostLine({ cost }: { cost: MonthlyCost }) {
  const unset = unsetNote(cost);
  return (
    <p className="text-sm">
      <span className="font-semibold">
        ~<CountUp value={cost.total} format={lei} />
        /lună
      </span>{" "}
      <span className="text-muted">
        {COST_NOTE} (carburant {lei(cost.fuel)}
        {cost.unset.includes("insuranceYear")
          ? ""
          : `, RCA ${lei(cost.insurance)}`}
        {cost.unset.includes("roadTaxYear") ? "" : `, impozit ${lei(cost.tax)}`}
        {cost.unset.includes("maintenanceYear")
          ? ""
          : `, întreținere ${lei(cost.maintenance)}`}
        ){unset && `; ${unset}`}
      </span>
    </p>
  );
}
