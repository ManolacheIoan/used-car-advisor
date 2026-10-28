"use client";

import { useEffect, useRef, useState } from "react";

/** Eases from the previous value (0 on mount) to `target`. Instant when the user prefers reduced motion. */
export function useCountUp(target: number, ms = 700): number {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const a = from.current;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = reduce ? 1 : Math.min(1, (t - start) / ms);
      const v = a + (target - a) * (1 - (1 - k) ** 3);
      from.current = v;
      setValue(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

/** Animated number with a reserved width (no layout shift); screen readers get the final value only. */
export function CountUp({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const shown = useCountUp(value);
  const final = format(value);
  // The invisible final value sizes the box, so the animated text never shifts layout.
  return (
    <span className="relative inline-block tabular-nums">
      <span className="invisible" aria-hidden>
        {final}
      </span>
      <span className="absolute inset-y-0 left-0 whitespace-nowrap" aria-hidden>
        {format(shown)}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}

/** Whole-number count-up, usable from server components (no function props). */
export function CountInt({ value }: { value: number }) {
  return <CountUp value={value} format={(n) => String(Math.round(n))} />;
}
