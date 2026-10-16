import { describe, expect, it } from "vitest";
import { exportPayload } from "@/lib/exportList";
import { car } from "./fixtures";

describe("exportPayload", () => {
  it("exports model identity and links only", () => {
    const p = exportPayload(
      "favorite",
      [car({ id: "x", brand: "B", model: "M", generation: "I" })],
      "2026-10-16",
    );
    expect(p).toEqual({
      site: "AlegeMasina",
      kind: "favorite",
      exported_on: "2026-10-16",
      items: [
        {
          id: "x",
          brand: "B",
          model: "M",
          generation: "I",
          years: "2015–2020",
          url: "https://alegemasina.netlify.app/masini/x/",
        },
      ],
    });
  });
});
