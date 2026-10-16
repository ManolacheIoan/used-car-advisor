export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label="Scor de potrivire"
        className="bg-surface-2 h-2.5 flex-1 overflow-hidden rounded-full"
      >
        <div
          className="bg-accent h-full origin-left animate-[grow_0.6s_ease-out] rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-14 text-right font-semibold tabular-nums">
        {score}/100
      </span>
    </div>
  );
}
