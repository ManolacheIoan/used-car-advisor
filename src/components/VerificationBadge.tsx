import type { CarModel } from "@/lib/types";

/** Shown while data comes from public sources but is not yet confirmed by the site owner. */
export function VerificationBadge({ m }: { m: CarModel }) {
  if (m.verified !== false) return null;
  return (
    <span
      className="border-accent/50 text-accent-text inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      title="Date preluate din surse publice, încă neconfirmate de noi. Verifică întotdeauna cu vânzătorul."
    >
      Date în curs de verificare
    </span>
  );
}
