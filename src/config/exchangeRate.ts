/**
 * EUR→RON rate shown next to prices (prices themselves stay in EUR; nothing is converted).
 * Fill in all three fields together from an official source (e.g. the BNR reference rate). Empty = not shown as a value.
 */
export const EXCHANGE_RATE: {
  eurRon: number | null;
  date: string | null;
  source: { title: string; url: string } | null;
} = {
  eurRon: null,
  date: null,
  source: null,
};
