import { EXCHANGE_RATE } from "@/config/exchangeRate";
import type { CarModel } from "@/lib/types";

/** Label required next to every price: asking prices from listings, approximate, EUR, collection date. */
export function priceNote(p: NonNullable<CarModel["price_eur"]>): string {
  return `prețuri cerute în anunțuri, orientativ, în EUR, culese la ${p.collected_on} (${p.n_listings} anunțuri)`;
}

export function ExchangeRateNote() {
  const r = EXCHANGE_RATE;
  if (r.eurRon === null || !r.date || !r.source)
    return <span>Curs EUR/RON: necompletat.</span>;
  return (
    <span>
      Curs orientativ: 1 € = {r.eurRon.toLocaleString("ro-RO")} lei (
      <a href={r.source.url} rel="noopener nofollow" className="underline">
        {r.source.title}
      </a>
      , <time dateTime={r.date}>{r.date}</time>).
    </span>
  );
}
