import { lei } from "@/lib/labels";
import type { MonthlyCost } from "@/lib/cost";

export function CostLine({ cost }: { cost: MonthlyCost }) {
  return (
    <p className="text-sm">
      <span className="font-semibold">~{lei(cost.total)}/lună</span>{" "}
      <span className="text-muted">
        orientativ (carburant {lei(cost.fuel)}, RCA {lei(cost.insurance)},
        impozit {lei(cost.tax)}, întreținere {lei(cost.maintenance)})
      </span>
    </p>
  );
}
