import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

/** Layout for site pages (methodology, legal, contact): breadcrumbs, title, last-reviewed date, prose body. */
export function StaticPage({
  title,
  href,
  reviewed,
  children,
}: {
  title: string;
  href: string;
  reviewed: string;
  children: ReactNode;
}) {
  return (
    <article className="max-w-3xl space-y-5">
      <Breadcrumbs items={[{ name: title, href }]} />
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted text-sm">
          Ultima revizuire: <time dateTime={reviewed}>{reviewed}</time>
        </p>
      </header>
      <div className="prose">{children}</div>
    </article>
  );
}
