// In demo mode next.config.ts aliases this import to cars.demo.json.
import raw from "@/data/cars.public.json";
import { brandId } from "./brand";
import type { Catalog, CarModel } from "./types";

export const catalog = raw as Catalog;
export const models: CarModel[] = catalog.models;
export const dataUpdated = catalog.updated;

export { V1_ENERGIES } from "./dataChecks";

/** Brands present in the catalog: [brand id, display name], sorted by name. */
export const BRANDS: [string, string][] = [
  ...new Map(models.map((m) => [brandId(m.brand), m.brand])),
].sort((a, b) => a[1].localeCompare(b[1], "ro"));

export function getModel(id: string): CarModel | undefined {
  return models.find((m) => m.id === id);
}
