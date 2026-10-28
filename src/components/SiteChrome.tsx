import Link from "next/link";
import { dataUpdated } from "@/lib/data";
import { SITE } from "@/lib/site";
import { FavoritesCount } from "./FavoriteButton";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="no-print border-line sticky top-0 z-40 border-b bg-[var(--glass)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="font-display flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span
            aria-hidden
            className="bg-accent text-on-accent glow grid size-7 place-items-center rounded-lg text-sm"
          >
            A
          </span>
          <span className="max-sm:sr-only">
            <span className="text-accent-text">Alege</span>Masina
          </span>
        </Link>
        <nav
          className="flex items-center gap-1 sm:gap-2"
          aria-label="Principal"
        >
          <Link
            href="/catalog/"
            className="text-muted hover:text-fg hover:bg-surface-2 rounded-full px-2 py-1.5 text-sm font-medium transition-colors sm:px-3"
          >
            Catalog
          </Link>
          <Link
            href="/instrumente/"
            className="text-muted hover:text-fg hover:bg-surface-2 rounded-full px-2 py-1.5 text-sm font-medium transition-colors sm:px-3"
          >
            Instrumente
          </Link>
          <Link
            href="/favorite/"
            className="text-muted hover:text-fg hover:bg-surface-2 rounded-full px-2 py-1.5 text-sm font-medium transition-colors sm:px-3"
          >
            Favorite
            <FavoritesCount />
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

const FOOTER_LINKS: [string, string][][] = [
  [
    ["/catalog/", "Catalog"],
    ["/marci/", "Mărci"],
    ["/instrumente/", "Instrumente"],
    ["/ghiduri/", "Ghiduri"],
    ["/glosar/", "Glosar"],
  ],
  [
    ["/metodologie/", "Metodologie"],
    ["/despre-date/", "Despre date și limitări"],
    ["/surse/", "Surse și atribuiri"],
    ["/intrebari-frecvente/", "Întrebări frecvente"],
  ],
  [
    ["/contact/", "Contact și corecturi"],
    ["/confidentialitate/", "Confidențialitate"],
    ["/termeni/", "Termeni"],
    ["/politica-continut-sponsorizat/", "Conținut sponsorizat"],
  ],
];

export function SiteFooter() {
  return (
    <footer className="border-line text-muted mt-auto border-t text-sm">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
        <nav aria-label="Subsol" className="grid gap-4 sm:grid-cols-3">
          {FOOTER_LINKS.map((col, i) => (
            <ul key={i} className="space-y-1.5">
              {col.map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="hover:text-fg underline-offset-2 hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </nav>
        <p>
          Prețurile și costurile sunt orientative. Verifică întotdeauna cu
          vânzătorul. Date actualizate la{" "}
          <time dateTime={dataUpdated}>{dataUpdated}</time>. Corecturi:{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="hover:text-fg underline"
          >
            {SITE.contactEmail}
          </a>
          .
        </p>
        <p className="text-xs">
          Numele și siglele mărcilor aparțin proprietarilor lor. Acest site nu
          este afiliat cu niciun producător auto.
        </p>
      </div>
    </footer>
  );
}
