/**
 * Usage-fit rules (the "U" part of the score in src/lib/scoring.ts).
 *
 * For each usage: U = base + sum(points of rules met), so a model meeting every rule gets exactly 1.
 * Rules only change the score; they never remove a model (only fuel, body, brand and seats are hard filters).
 * `yes` / `no` are the "de ce" chips shown to the user; `reason` documents why the rule exists.
 * Thresholds are inclusive and use declared (manufacturer) values from the data.
 */
import type { CarModel, Engine, Usage } from "@/lib/types";

export interface UsageRule {
  test: (m: CarModel, e: Engine) => boolean;
  points: number;
  yes: string;
  no?: string;
  reason: string;
}

export const USAGE_RULES: Record<Usage, { base: number; rules: UsageRule[] }> =
  {
    oras: {
      base: 0.3,
      rules: [
        {
          test: (m) => m.body === "hatchback",
          points: 0.4,
          yes: "Hatchback, ușor de parcat",
          no: "Nu e hatchback; poate fi mai greu de parcat",
          reason:
            "We have no length data; body type is the simplest proxy for an easy-to-park car.",
        },
        {
          test: (_, e) => e.consumption.value <= 6,
          points: 0.3,
          yes: "Consum declarat mic",
          no: "Consum declarat peste 6 l/100 km",
          reason:
            "City driving raises real consumption, so a low declared figure matters most here.",
        },
      ],
    },
    autostrada: {
      base: 0.3,
      rules: [
        {
          test: (_, e) => e.energy === "motorina",
          points: 0.3,
          yes: "Motorină, potrivită pe distanțe lungi",
          reason:
            "Diesel engines are typically most efficient at constant highway speeds.",
        },
        {
          test: (_, e) => e.hp >= 100,
          points: 0.4,
          yes: "Putere de cel puțin 100 CP",
          no: "Sub 100 CP pentru autostradă",
          reason:
            "Enough power for safe overtaking and merging at highway speed.",
        },
      ],
    },
    familie: {
      base: 0.2,
      rules: [
        {
          test: (m) => m.trunk_l >= 400,
          points: 0.4,
          yes: "Portbagaj de cel puțin 400 l",
          no: "Portbagaj sub 400 l",
          reason:
            "Room for a stroller plus luggage is the most common family constraint.",
        },
        {
          test: (m) => ["break", "suv", "mpv"].includes(m.body),
          points: 0.2,
          yes: "Caroserie spațioasă",
          reason:
            "These body types usually offer more rear-seat and cargo space.",
        },
        {
          test: (m) => m.seats >= 5,
          points: 0.2,
          yes: "Cel puțin 5 locuri",
          reason: "A family of four plus one guest or child seat.",
        },
      ],
    },
    mixt: {
      base: 0.5,
      rules: [
        {
          test: (_, e) => e.consumption.value <= 6.5,
          points: 0.25,
          yes: "Consum declarat moderat",
          reason: "Balanced running cost across city and road use.",
        },
        {
          test: (_, e) => e.hp >= 90,
          points: 0.25,
          yes: "Putere suficientă pentru drum",
          reason: "Enough power for occasional highway trips.",
        },
      ],
    },
  };
