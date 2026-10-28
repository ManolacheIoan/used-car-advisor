import { BODY_LABEL } from "@/lib/labels";
import type { Body } from "@/lib/types";

/** Original, generic side profiles (not based on any specific model). viewBox 120×48, ground at y=40. */
export const SHAPES: Record<Body, string> = {
  hatchback:
    "M8 36 L8 28 Q10 24 18 23 L34 21 L46 12 Q50 10 58 10 L84 10 Q90 10 93 15 L100 24 L102 36 Z",
  sedan:
    "M6 36 L6 28 Q8 24 16 23 L32 21 L44 12 Q48 10 56 10 L76 10 Q82 10 86 15 L92 21 L108 22 Q112 23 112 27 L112 36 Z",
  break:
    "M6 36 L6 28 Q8 24 16 23 L30 21 L42 12 Q46 10 54 10 L104 10 Q109 10 110 15 L112 24 L112 36 Z",
  suv: "M8 34 L8 24 Q10 20 18 19 L30 18 L40 8 Q43 6 50 6 L98 6 Q104 6 106 11 L110 20 L110 34 Z",
  mpv: "M8 36 L8 26 Q10 22 16 21 L26 12 Q32 7 42 7 L102 7 Q108 7 109 12 L112 24 L112 36 Z",
};
export const WHEELS: Record<Body, [number, number, number]> = {
  hatchback: [26, 84, 7],
  sedan: [26, 90, 7],
  break: [26, 92, 7],
  suv: [28, 90, 8.5],
  mpv: [28, 92, 7.5],
};

export function BodyIcon({
  body,
  className = "h-8 w-20",
  decorative = false,
}: {
  body: Body;
  className?: string;
  /** Hide from assistive tech when the label is already in the text next to it. */
  decorative?: boolean;
}) {
  const [a, b, r] = WHEELS[body];
  const cy = 40 - r;
  return (
    <svg
      viewBox="0 0 120 48"
      className={className}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": BODY_LABEL[body] })}
    >
      <path
        d={SHAPES[body]}
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line
        x1="2"
        y1="40.5"
        x2="118"
        y2="40.5"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      {[a, b].map((x) => (
        <g key={x}>
          <circle
            cx={x}
            cy={cy}
            r={r}
            fill="var(--bg)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx={x}
            cy={cy}
            r={r / 2.6}
            fill="currentColor"
            fillOpacity="0.5"
          />
        </g>
      ))}
    </svg>
  );
}
