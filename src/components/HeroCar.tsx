import type { Body } from "@/lib/types";
import { SHAPES, WHEELS } from "./BodyIcon";

/** x of the rear edge of each shape (front is at x ≈ 6–8), for the tail light. */
const REAR_X: Record<Body, number> = {
  hatchback: 102,
  sedan: 112,
  break: 112,
  suv: 110,
  mpv: 112,
};

/**
 * Decorative hero illustration: an original, generic side profile (same shapes as BodyIcon; the front is on the
 * left) that drives in from the right, idles, and spins its wheels over road lines streaming to the right.
 * Transform/opacity only; static with reduced motion.
 */
export function HeroCar({ body = "suv" }: { body?: Body }) {
  const [a, b, r] = WHEELS[body];
  const cy = 40 - r;
  return (
    <svg
      viewBox="-6 -6 132 58"
      className="h-auto w-full overflow-visible"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="hero-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--cyan)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="hero-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--cyan)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
        <radialGradient id="hero-light" cx="1" cy="0.5" r="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Road: dashed lines streaming to the right (the car drives left). */}
      <g opacity="0.5">
        <line
          x1="-6"
          y1="41"
          x2="126"
          y2="41"
          stroke="var(--border)"
          strokeWidth="0.6"
        />
        <g className="road-lines">
          {Array.from({ length: 18 }, (_, i) => (
            <rect
              key={i}
              x={-38 + i * 16}
              y="44.5"
              width="8"
              height="0.9"
              rx="0.45"
              fill="var(--muted)"
            />
          ))}
        </g>
      </g>

      <g className="car-drive">
        <g className="car-idle">
          <ellipse cx="60" cy="41" rx="56" ry="3" fill="url(#hero-shadow)" />
          {/* Headlight beam ahead of the front (left). */}
          <ellipse cx="-4" cy="28" rx="16" ry="6" fill="url(#hero-light)" />
          <path
            d={SHAPES[body]}
            fill="url(#hero-body)"
            stroke="url(#hero-stroke)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Window line and door cut, for depth. */}
          <path
            d={SHAPES[body]}
            fill="none"
            stroke="var(--text)"
            strokeOpacity="0.12"
            strokeWidth="0.5"
            transform="translate(2 2) scale(0.965)"
          />
          {/* Headlight (front, left) and tail light (rear, right). */}
          <rect
            x="8.5"
            y="25.5"
            width="5"
            height="1.6"
            rx="0.8"
            fill="var(--accent)"
          />
          <rect
            x={REAR_X[body] - 4}
            y="25"
            width="3"
            height="2.4"
            rx="0.8"
            fill="#ff4d4d"
          />
          {[a, b].map((x) => (
            <g key={x}>
              <circle
                cx={x}
                cy={cy}
                r={r}
                fill="var(--bg)"
                stroke="url(#hero-stroke)"
                strokeWidth="1.4"
              />
              <g className="wheel-spin">
                {[0, 60, 120].map((deg) => (
                  <line
                    key={deg}
                    x1={x - r * 0.62}
                    y1={cy}
                    x2={x + r * 0.62}
                    y2={cy}
                    stroke="var(--muted)"
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    transform={`rotate(${deg} ${x} ${cy})`}
                  />
                ))}
                <circle cx={x} cy={cy} r={r * 0.22} fill="var(--accent)" />
              </g>
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
