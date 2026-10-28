import { IS_SHOWCASE } from "@/lib/mode";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Notice } from "@/components/ui";
import { visibleGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Ghiduri",
  description:
    "Ghiduri orientative pentru cumpărarea unei mașini second-hand: verificare, acte, test drive, negociere.",
  alternates: { canonical: "/ghiduri/" },
};

export default function Page() {
  const guides = visibleGuides("ghid");
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ name: "Ghiduri", href: "/ghiduri/" }]} />
      <h1 className="page-title">Ghiduri</h1>
      {guides.length === 0 ? (
        <Notice title="Ghidurile sunt în pregătire">
          <p className="text-muted">Le publicăm după revizuire.</p>
        </Notice>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/ghiduri/${g.slug}/`}
                className="card card-hover block h-full p-4"
              >
                <span className="font-semibold">{g.title}</span>
                <span className="text-muted mt-1 block text-sm">
                  {g.description}
                </span>
                {g.status === "draft" && !IS_SHOWCASE && (
                  <span className="text-accent-text mt-2 block text-xs font-semibold">
                    CIORNĂ
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
