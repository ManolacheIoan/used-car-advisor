import Link from "next/link";
import { SITE } from "@/lib/site";

export interface Crumb {
  name: string;
  href: string;
}

/** Visible breadcrumbs plus schema.org BreadcrumbList (Acasă is always first). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: "Acasă", href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE.url}${c.href}`,
    })),
  };
  return (
    <nav aria-label="Navigare ierarhică" className="text-muted text-sm">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ol className="flex flex-wrap items-center gap-1">
        {all.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>›</span>}
            {i === all.length - 1 ? (
              <span aria-current="page" className="text-fg">
                {c.name}
              </span>
            ) : (
              <Link
                href={c.href}
                className="hover:text-fg underline-offset-2 hover:underline"
              >
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
