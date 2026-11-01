const OUTER = Array.from({ length: 24 }, (_, index) => index * 15);
const INNER = Array.from({ length: 12 }, (_, index) => index * 30 + 15);
const DOTS = Array.from({ length: 12 }, (_, index) => index * 30);

/** A slowly turning mandala line drawing. Decorative; it takes its colour from the parent. */
export function Mandala({ className = "" }: { className?: string }) {
  return (
    <svg className={`mandala ${className}`.trim()} viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <g className="mandala-a" fill="none" stroke="currentColor" strokeWidth="0.9">
        <circle r="97" strokeDasharray="1 5" />
        {OUTER.map((turn) => (
          <path key={turn} transform={`rotate(${turn})`} d="M0 -62 C6 -76 6 -88 0 -96 C-6 -88 -6 -76 0 -62Z" />
        ))}
      </g>
      <g className="mandala-b" fill="none" stroke="currentColor" strokeWidth="1.1">
        {INNER.map((turn) => (
          <path key={turn} transform={`rotate(${turn})`} d="M0 -28 C12 -40 12 -54 0 -64 C-12 -54 -12 -40 0 -28Z" />
        ))}
        {DOTS.map((turn) => (
          <circle key={turn} transform={`rotate(${turn}) translate(0 -74)`} r="1.6" fill="currentColor" stroke="none" />
        ))}
        <circle r="24" />
        <circle r="17" strokeDasharray="2 3" />
      </g>
    </svg>
  );
}
