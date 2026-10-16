import Link from "next/link";
import type { BrandGroup } from "@/lib/taxonomy";
import { BrandBadge } from "./BrandBadge";

export function BrandCard({ b }: { b: BrandGroup }) {
  return (
    <li>
      <Link
        href={`/marci/${b.id}/`}
        className="card card-hover flex h-full flex-col gap-2 p-4"
      >
        <BrandBadge brand={b.name} size="lg" />
        <span className="font-semibold">{b.name}</span>
        <span className="text-muted text-sm">
          {b.lines.length} {b.lines.length === 1 ? "model" : "modele"},{" "}
          {b.count} {b.count === 1 ? "generație" : "generații"}
        </span>
      </Link>
    </li>
  );
}
