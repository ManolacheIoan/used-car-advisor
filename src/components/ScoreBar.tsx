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
          className="bg-accent animate-grow h-full rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="min-w-16 text-right font-semibold whitespace-nowrap tabular-nums">
        {score}/100
      </span>
    </div>
  );
}
