import { lei } from "@/lib/labels";
import { CountUp } from "./CountUp";
import { COST_NOTE, type MonthlyCost } from "@/lib/cost";

export function CostLine({ cost }: { cost: MonthlyCost }) {
  return (
    <p className="text-sm">
      <span className="font-semibold">
        ~<CountUp value={cost.total} format={lei} />
        /lună
      </span>{" "}
      <span className="text-muted">
        {COST_NOTE} (carburant {lei(cost.fuel)}, RCA {lei(cost.insurance)},
        impozit {lei(cost.tax)}, întreținere {lei(cost.maintenance)})
      </span>
    </p>
  );
}
