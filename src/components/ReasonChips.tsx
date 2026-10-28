import type { Reason } from "@/lib/scoring";

export function ReasonChips({ reasons }: { reasons: Reason[] }) {
  return (
    <div>
      <p className="text-muted mb-1.5 text-xs font-semibold tracking-wide uppercase">
        De ce
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {reasons.map((r) => (
          <li
            key={r.text}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              r.positive
                ? "border-accent/50 bg-accent/10 text-fg"
                : "border-line text-muted"
            }`}
          >
            <span aria-hidden className={r.positive ? "text-accent-text" : ""}>
              {r.positive ? "✓ " : "– "}
            </span>
            <span className="sr-only">{r.positive ? "Plus: " : "Minus: "}</span>
            {r.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
