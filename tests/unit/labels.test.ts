import { describe, expect, it } from "vitest";
import { consumptionRange, engineSummary, generationLabel } from "@/lib/labels";
import { car, engine } from "./fixtures";

const l = (value: number) => ({ value, unit: "l/100km" as const });

describe("model labels", () => {
  const m = car({
    generation: "VII",
    years: { from: 2012, to: 2021 },
    engines: [
      engine({ cc: 1197, hp: 85, consumption: l(4.9) }),
      engine({ cc: 1197, hp: 105, consumption: l(4.9) }),
      engine({ energy: "motorina", cc: 1598, hp: 110, consumption: l(3.8) }),
    ],
  });

  it("generation with years", () => {
    expect(generationLabel(m)).toBe("Generația VII · 2012–2021");
  });

  it("groups engines by fuel and exact displacement", () => {
    expect(engineSummary(m)).toBe(
      "benzină 1197 cm³ (85–105 CP), motorină 1598 cm³ (110 CP)",
    );
  });

  it("consumption range with Romanian decimals", () => {
    expect(consumptionRange(m)).toBe("3,8–4,9 l/100 km");
    expect(
      consumptionRange(car({ engines: [engine({ consumption: l(5) })] })),
    ).toBe("5 l/100 km");
  });
});
