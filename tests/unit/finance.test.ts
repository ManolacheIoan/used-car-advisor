import { describe, expect, it } from "vitest";
import { loanPayment, validateLoan } from "@/lib/finance";

describe("loanPayment (annuity)", () => {
  it("matches the annuity formula", () => {
    // 10 000 borrowed, 12 %/year (1 %/month), 12 months → 888.49 per month
    const r = loanPayment({
      price: 12000,
      downPayment: 2000,
      annualRatePct: 12,
      months: 12,
    });
    expect(r.principal).toBe(10000);
    expect(r.payment).toBeCloseTo(888.49, 2);
    expect(r.totalInterest).toBeCloseTo(661.86, 1);
    expect(r.totalPaid).toBeCloseTo(12661.86, 1);
  });

  it("zero interest divides evenly", () => {
    const r = loanPayment({
      price: 6000,
      downPayment: 0,
      annualRatePct: 0,
      months: 24,
    });
    expect(r.payment).toBe(250);
    expect(r.totalInterest).toBe(0);
  });

  it("down payment equal to price means nothing to finance", () => {
    expect(
      loanPayment({
        price: 5000,
        downPayment: 5000,
        annualRatePct: 10,
        months: 12,
      }).payment,
    ).toBe(0);
  });

  it.each([
    [{ price: 0, downPayment: 0, annualRatePct: 5, months: 12 }, "Prețul"],
    [
      { price: 100, downPayment: 200, annualRatePct: 5, months: 12 },
      "Avansul nu poate depăși",
    ],
    [{ price: 100, downPayment: 0, annualRatePct: 101, months: 12 }, "Dobânda"],
    [{ price: 100, downPayment: 0, annualRatePct: 5, months: 0 }, "Perioada"],
    [{ price: 100, downPayment: 0, annualRatePct: 5, months: 1.5 }, "Perioada"],
  ])("rejects invalid input %#", (input, msg) => {
    expect(validateLoan(input).join(" ")).toContain(msg);
    expect(() => loanPayment(input)).toThrow(RangeError);
  });
});
