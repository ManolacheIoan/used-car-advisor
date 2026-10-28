import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";

export const card = "card p-4";
export const btnPrimary =
  "glow inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 font-semibold text-on-accent transition hover:-translate-y-px hover:brightness-110 active:translate-y-0 disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-[var(--glass)] px-5 py-2.5 font-medium backdrop-blur transition hover:border-accent/60 hover:bg-surface-2";

export function Loading({ label = "Se încarcă…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${card} bg-surface-2 h-28 animate-pulse`} />
      ))}
    </div>
  );
}

export function Notice({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children?: ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`${card} space-y-3 text-center`}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

export function BackToForm({ query = "" }: { query?: string }) {
  return (
    <Link href={`/${query ? `?${query}` : ""}`} className={btnGhost}>
      Modifică criteriile
    </Link>
  );
}

/**
 * Shared element across results, compare and detail (same `name` on each page).
 * Uses the browser View Transitions API through React; no-op where unsupported or with reduced motion.
 */
export function Morph({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
