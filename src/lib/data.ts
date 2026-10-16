import raw from "@/data/cars.json";
import type { Catalog, CarModel } from "./types";

export const catalog = raw as Catalog;
export const models: CarModel[] = catalog.models;
export const dataUpdated = catalog.updated;

export { V1_ENERGIES } from "./dataChecks";

export function getModel(id: string): CarModel | undefined {
  return models.find((m) => m.id === id);
}
