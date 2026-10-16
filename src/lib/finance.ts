/**
 * Loan maths only (no offers): annuity payment
 *   payment = P × r / (1 − (1 + r)^−n),  r = annual rate / 12,  n = months;  r = 0 → P / n
 * where P = price − down payment. Real offers add fees and insurance (DAE), so the real cost is higher.
 */
export interface LoanInput {
  price: number;
  downPayment: number;
  annualRatePct: number;
  months: number;
}

export interface LoanResult {
  principal: number;
  payment: number;
  totalPaid: number;
  totalInterest: number;
}

export function validateLoan(i: LoanInput): string[] {
  const e: string[] = [];
  if (!(Number.isFinite(i.price) && i.price > 0))
    e.push("Prețul trebuie să fie mai mare decât 0.");
  if (!(Number.isFinite(i.downPayment) && i.downPayment >= 0))
    e.push("Avansul nu poate fi negativ.");
  else if (i.downPayment > i.price) e.push("Avansul nu poate depăși prețul.");
  if (!(
    Number.isFinite(i.annualRatePct) &&
    i.annualRatePct >= 0 &&
    i.annualRatePct <= 100
  ))
    e.push("Dobânda anuală trebuie să fie între 0 și 100 %.");
  if (!(Number.isInteger(i.months) && i.months >= 1 && i.months <= 120))
    e.push("Perioada trebuie să fie între 1 și 120 de luni.");
  return e;
}

export function loanPayment(i: LoanInput): LoanResult {
  const errors = validateLoan(i);
  if (errors.length) throw new RangeError(errors.join(" "));
  const principal = i.price - i.downPayment;
  const r = i.annualRatePct / 100 / 12;
  const payment =
    r === 0
      ? principal / i.months
      : (principal * r) / (1 - (1 + r) ** -i.months);
  const totalPaid = payment * i.months + i.downPayment;
  return {
    principal,
    payment,
    totalPaid,
    totalInterest: payment * i.months - principal,
  };
}
