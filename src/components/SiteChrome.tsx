import Link from "next/link";
import { dataUpdated } from "@/lib/data";
import { SITE } from "@/lib/site";
import { FavoritesCount } from "./FavoriteButton";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="no-print border-line bg-surface border-b">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-bold tracking-tight">
          <span className="text-accent-text">Alege</span>Masina
        </Link>
        <nav className="flex items-center gap-2" aria-label="Principal">
          <Link
            href="/favorite/"
            className="text-muted hover:text-fg rounded-md px-2 py-1.5 text-sm"
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

export function SiteFooter() {
  return (
    <footer className="border-line text-muted mt-auto border-t text-sm">
      <div className="mx-auto w-full max-w-3xl space-y-2 px-4 py-6">
        <p>
          Prețurile și costurile sunt orientative. Verifică întotdeauna cu
          vânzătorul. Date actualizate la{" "}
          <time dateTime={dataUpdated}>{dataUpdated}</time>.
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/despre-date/" className="hover:text-fg underline">
            Despre date și limitări
          </Link>
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="hover:text-fg underline"
          >
            Corecturi: {SITE.contactEmail}
          </a>
        </p>
        <p className="text-xs">
          Numele și siglele mărcilor aparțin proprietarilor lor. Acest site nu
          este afiliat cu niciun producător auto.
        </p>
      </div>
    </footer>
  );
}
