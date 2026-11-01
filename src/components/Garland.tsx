import type { CSSProperties } from "react";

const SWAGS = 9;
const FLOWERS = 9;
const WIDTH = 200;
const ROPE_Y = 5;
/** Control point of the sagging string (a quadratic curve from x = 0 to x = 200). */
const SAG = { x: 100, y: 108 };

const PETAL_RINGS = [
  { count: 14, offset: 0, cy: -9, rx: 4.3, ry: 6.4 },
  { count: 11, offset: 7, cy: -6.4, rx: 3.7, ry: 5.2 },
  { count: 8, offset: 3, cy: -3.8, rx: 2.9, ry: 3.9 },
] as const;

const VARIANTS = [0, 1, 2] as const;

/** A point and the slope on the string at t (0 to 1). */
function onString(t: number) {
  const u = 1 - t;
  const x = 2 * u * t * SAG.x + t * t * WIDTH;
  const y = u * u * ROPE_Y + 2 * u * t * SAG.y + t * t * ROPE_Y;
  const dx = 2 * u * SAG.x + 2 * t * (WIDTH - SAG.x);
  const dy = 2 * u * (SAG.y - ROPE_Y) + 2 * t * (ROPE_Y - SAG.y);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const FLOWER_SPOTS = Array.from({ length: FLOWERS }, (_, index) => {
  const t = 0.07 + (index * 0.86) / (FLOWERS - 1);
  const spot = onString(t);
  return {
    ...spot,
    scale: 0.92 + ((index * 7) % 5) * 0.045,
    turn: (index * 47) % 360,
    variant: (index + (index > 4 ? 1 : 0)) % VARIANTS.length,
  };
});

const LEAF_SPOTS = Array.from({ length: FLOWERS - 1 }, (_, index) => {
  const spot = onString(0.07 + ((index + 0.5) * 0.86) / (FLOWERS - 1));
  return { x: spot.x, y: spot.y + 6, turn: 90 + (index % 2 === 0 ? -34 : 34) };
});

const VARIANT_STOPS = [
  ["#7c2d12", "#ea580c", "#f59e0b", "#fbbf24"],
  ["#92400e", "#f59e0b", "#fbbf24", "#fde68a"],
  ["#7c2d12", "#c2410c", "#f97316", "#fb923c"],
] as const;

function Defs() {
  return (
    <svg className="garland-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {VARIANTS.map((variant) => (
          <radialGradient key={variant} id={`pp-petal-${variant}`} cx="0" cy="0" r="15" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={VARIANT_STOPS[variant][0]} />
            <stop offset="0.38" stopColor={VARIANT_STOPS[variant][1]} />
            <stop offset="0.72" stopColor={VARIANT_STOPS[variant][2]} />
            <stop offset="1" stopColor={VARIANT_STOPS[variant][3]} />
          </radialGradient>
        ))}
        <linearGradient id="pp-leaf" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#365314" />
          <stop offset="1" stopColor="#84cc16" />
        </linearGradient>
        <linearGradient id="pp-rope" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
        {VARIANTS.map((variant) => (
          <g key={variant} id={`pp-marigold-${variant}`}>
            {PETAL_RINGS.map((ring) =>
              Array.from({ length: ring.count }, (_, index) => (
                <ellipse
                  key={`${ring.count}-${index}`}
                  cx="0"
                  cy={ring.cy}
                  rx={ring.rx}
                  ry={ring.ry}
                  transform={`rotate(${ring.offset + (index * 360) / ring.count})`}
                  fill={`url(#pp-petal-${variant})`}
                  stroke="#7c2d12"
                  strokeOpacity="0.32"
                  strokeWidth="0.45"
                />
              )),
            )}
            <circle r="2.1" fill="#7c2d12" />
            <circle r="1.1" cx="-0.5" cy="-0.5" fill="#fbbf24" fillOpacity="0.75" />
          </g>
        ))}
        <g id="pp-leaf-shape">
          <path d="M0 0 C4 -6 13 -6 20 0 C13 6 4 6 0 0Z" fill="url(#pp-leaf)" />
          <path d="M1 0 H18" stroke="#1a2e05" strokeOpacity="0.45" strokeWidth="0.6" fill="none" />
        </g>
      </defs>
    </svg>
  );
}

function Swag({ index, last }: { index: number; last: boolean }) {
  return (
    <li className="garland-swag" style={{ "--i": index } as CSSProperties}>
      <svg viewBox={`0 0 ${WIDTH} 90`} focusable="false">
        <path d={`M-1 ${ROPE_Y} H${WIDTH + 1}`} stroke="url(#pp-rope)" strokeWidth="2.6" strokeLinecap="round" />
        <g className="garland-sway">
          <path
            d={`M0 ${ROPE_Y} Q${SAG.x} ${SAG.y} ${WIDTH} ${ROPE_Y}`}
            fill="none"
            stroke="#92400e"
            strokeWidth="1.6"
          />
          {LEAF_SPOTS.map((leaf, i) => (
            <use
              key={i}
              href="#pp-leaf-shape"
              transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.turn}) scale(0.78)`}
            />
          ))}
          {FLOWER_SPOTS.map((flower, i) => (
            <use
              key={i}
              href={`#pp-marigold-${flower.variant}`}
              transform={`translate(${flower.x.toFixed(1)} ${flower.y.toFixed(1)}) rotate(${flower.turn}) scale(${flower.scale.toFixed(2)})`}
            />
          ))}
        </g>
        <g className="garland-tassel">
          <path d={`M0 ${ROPE_Y} V60`} stroke="#92400e" strokeWidth="1.2" />
          {[40, 47, 54].map((y) => (
            <circle key={y} cx="0" cy={y} r="2.1" fill="#f59e0b" stroke="#7c2d12" strokeOpacity="0.4" strokeWidth="0.5" />
          ))}
          <use href="#pp-leaf-shape" transform="translate(0 57) rotate(122) scale(0.55)" />
          <use href="#pp-leaf-shape" transform="translate(0 57) rotate(58) scale(0.55)" />
          <use href="#pp-marigold-1" transform="translate(0 63) scale(0.68)" />
          <use href="#pp-marigold-2" transform="translate(0 20) scale(1.1)" />
        </g>
        {last ? (
          <g className="garland-tassel" style={{ animationDelay: "-2s" }}>
            <path d={`M${WIDTH} ${ROPE_Y} V60`} stroke="#92400e" strokeWidth="1.2" />
            <use href="#pp-marigold-1" transform={`translate(${WIDTH} 63) scale(0.68)`} />
            <use href="#pp-marigold-0" transform={`translate(${WIDTH} 20) scale(1.1)`} />
          </g>
        ) : null}
      </svg>
    </li>
  );
}

/** A hanging marigold garland, drawn in code. Decorative only. */
export function Garland() {
  return (
    <div className="garland" aria-hidden="true">
      <Defs />
      <ul className="garland-row">
        {Array.from({ length: SWAGS }, (_, index) => (
          <Swag key={index} index={index} last={index === SWAGS - 1} />
        ))}
      </ul>
    </div>
  );
}
