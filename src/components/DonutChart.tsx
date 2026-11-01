import { dashFor, donutArcs } from "../donut";

export interface DonutItem {
  label: string;
  value: number;
  /** Text shown beside the label, such as "₹4,50,000". */
  valueLabel: string;
}

interface DonutChartProps {
  title: string;
  items: DonutItem[];
  /** Short text in the middle of the ring. */
  centre: string;
}

const TONES = 6;
const RADIUS = 15.9155;

/** A ring chart. The picture is decorative: the legend carries every number as text. */
export function DonutChart({ title, items, centre }: DonutChartProps) {
  const arcs = donutArcs(items.map((item) => item.value));

  return (
    <figure className="donut">
      <figcaption className="donut-title">{title}</figcaption>
      <div className="donut-ring">
        <svg viewBox="0 0 42 42" aria-hidden="true" focusable="false">
          <circle className="donut-track" cx="21" cy="21" r={RADIUS} />
          {arcs.map((arc, index) =>
            arc.length > 0 ? (
              <circle
                key={items[index]?.label ?? index}
                className={`donut-arc tone-${index % TONES}`}
                cx="21"
                cy="21"
                r={RADIUS}
                pathLength="100"
                transform="rotate(-90 21 21)"
                style={dashFor(arc)}
              />
            ) : null,
          )}
        </svg>
        <p className="donut-centre">{centre}</p>
      </div>
      <ul className="donut-legend">
        {items.map((item, index) => (
          <li key={item.label}>
            <span className={`swatch tone-${index % TONES}`} aria-hidden="true" />
            <span className="donut-label">{item.label}</span>
            <span className="donut-share">{Math.round(arcs[index]?.share ?? 0)}%</span>
            <span className="donut-amount">{item.valueLabel}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
