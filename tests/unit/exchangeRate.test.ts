import { describe, expect, it } from "vitest";
import { EXCHANGE_RATE } from "@/config/exchangeRate";

describe("exchange rate config", () => {
  it("is either fully empty or fully filled (rate, date, source)", () => {
    const filled = [
      EXCHANGE_RATE.eurRon !== null,
      EXCHANGE_RATE.date !== null,
      EXCHANGE_RATE.source !== null,
    ];
    expect(filled.every(Boolean) || filled.every((f) => !f)).toBe(true);
  });

  it("when filled, has a positive rate, a valid past date and an https source", () => {
    if (EXCHANGE_RATE.eurRon === null) return;
    expect(EXCHANGE_RATE.eurRon).toBeGreaterThan(0);
    expect(EXCHANGE_RATE.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Date.parse(EXCHANGE_RATE.date!)).toBeLessThanOrEqual(Date.now());
    expect(EXCHANGE_RATE.source!.url).toMatch(/^https:\/\//);
  });
});
