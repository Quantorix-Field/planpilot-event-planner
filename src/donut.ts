/** The donut circle is drawn with pathLength="100", so every length below is a percentage. */
export const DONUT_GAP = 0.8;

export interface DonutArc {
  /** Where the arc starts, 0 to 100 around the ring. */
  start: number;
  /** How much of the ring the arc covers, after leaving a small gap. */
  length: number;
  /** This slice's share of the whole, 0 to 100. */
  share: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Turns amounts into ring arcs. Negative or missing amounts count as zero,
 * and no positive total gives no arcs.
 */
export function donutArcs(values: readonly number[], gap: number = DONUT_GAP): DonutArc[] {
  const safe = values.map((value) => (Number.isFinite(value) && value > 0 ? value : 0));
  const total = safe.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return [];

  const visibleGap = safe.filter((value) => value > 0).length > 1 ? gap : 0;
  let cursor = 0;
  return safe.map((value) => {
    const share = (value / total) * 100;
    const arc = {
      start: round(cursor),
      length: round(Math.max(0, share - visibleGap)),
      share: round(share),
    };
    cursor += share;
    return arc;
  });
}

/** The dash pattern for one arc: draw `length`, then leave the rest of the ring empty. */
export function dashFor(arc: DonutArc): { strokeDasharray: string; strokeDashoffset: number } {
  return {
    strokeDasharray: `${arc.length} ${round(100 - arc.length)}`,
    strokeDashoffset: -arc.start,
  };
}
