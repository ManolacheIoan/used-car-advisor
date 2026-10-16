import raw from "@/data/cars.json";
import type { Catalog, CarModel } from "./types";

export const catalog = raw as Catalog;
export const models: CarModel[] = catalog.models;
export const dataUpdated = catalog.updated;

/** Energy types offered in V1. Hybrid/electric are schema-ready but not used yet. */
export const V1_ENERGIES = ["benzina", "motorina", "gpl"] as const;

export function getModel(id: string): CarModel | undefined {
  return models.find((m) => m.id === id);
}
