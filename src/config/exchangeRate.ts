/**
 * EUR→RON rate shown wherever a conversion appears (prices stay in EUR; costs in lei).
 * Set by the user; before hosting replace it with the official BNR reference rate of that day (bnr.ro).
 * CI prints a warning (it does not fail) when `date` is older than EXCHANGE_RATE_MAX_AGE_DAYS.
 */
export const EXCHANGE_RATE: {
  eurRon: number | null;
  date: string | null;
  source: { title: string; url: string } | null;
} = {
  eurRon: 5.33,
  date: "2026-10-16",
  source: {
    title: "curs de referință BNR (verificat de utilizator)",
    url: "https://www.bnr.ro/",
  },
};

export const EXCHANGE_RATE_MAX_AGE_DAYS = 30;

/** EUR → RON with the configured rate; null when no rate is set. */
export const eurToRon = (eur: number) =>
  EXCHANGE_RATE.eurRon === null ? null : eur * EXCHANGE_RATE.eurRon;
