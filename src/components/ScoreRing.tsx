/** Circular fit-score gauge (0–100). The arc draws in on mount; static with reduced motion. */
export function ScoreRing({
  score,
  size = 76,
}: {
  score: number;
  size?: number;
}) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
      aria-label="Scor de potrivire"
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 72 72"
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--cyan)" />
          </linearGradient>
        </defs>
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth="6"
        />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="url(#score-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="animate-ring"
          style={{ ["--ring-from" as string]: c }}
        />
      </svg>
      <span className="font-display text-center leading-none">
        <span className="block text-2xl font-bold tabular-nums">{score}</span>
        <span className="text-muted block text-[0.6rem] font-semibold tracking-widest uppercase">
          /100
        </span>
      </span>
    </div>
  );
}
