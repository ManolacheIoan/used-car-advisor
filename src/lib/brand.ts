/** "Škoda" → "skoda", "Mercedes-Benz" → "mercedes-benz". File name used for public/brands/<id>.svg|png. */
export function brandId(brand: string): string {
  return brand
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
