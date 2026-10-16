import { BODY_LABEL, ENERGY_LABEL } from "./labels";
import { IS_DEMO } from "./mode";
import { SITE } from "./site";
import type { CarModel } from "./types";

/** Only verified, non-demo models in a public build are indexed and listed in the sitemap. */
export const isIndexable = (m: CarModel) =>
  !IS_DEMO && !m.is_demo && m.verified;

export const modelTitle = (m: CarModel) =>
  `${m.brand} ${m.model} ${m.generation} (${m.years.from}–${m.years.to})`;

export function modelDescription(m: CarModel): string {
  const fuels = [
    ...new Set(m.engines.map((e) => ENERGY_LABEL[e.energy].toLowerCase())),
  ].join(", ");
  return `${modelTitle(m)}: ${BODY_LABEL[m.body].toLowerCase()}, ${m.seats} locuri, portbagaj ${m.trunk_l} l, ${fuels}. Specificații, preț orientativ second-hand și cost lunar estimat.`;
}

/** schema.org Car. Only fields present in our data; no ratings or offers. */
export function modelJsonLd(m: CarModel) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${m.brand} ${m.model} ${m.generation}`,
    brand: { "@type": "Brand", name: m.brand },
    model: m.model,
    bodyType: BODY_LABEL[m.body],
    seatingCapacity: m.seats,
    cargoVolume: {
      "@type": "QuantitativeValue",
      value: m.trunk_l,
      unitCode: "LTR",
    },
    productionDate: `${m.years.from}/${m.years.to}`,
    vehicleEngine: m.engines.map((e) => ({
      "@type": "EngineSpecification",
      fuelType: ENERGY_LABEL[e.energy],
      ...(e.cc
        ? {
            engineDisplacement: {
              "@type": "QuantitativeValue",
              value: e.cc,
              unitCode: "CMQ",
            },
          }
        : {}),
      enginePower: {
        "@type": "QuantitativeValue",
        value: e.hp,
        unitText: "CP",
      },
    })),
    url: `${SITE.url}/masini/${m.id}/`,
  };
}
