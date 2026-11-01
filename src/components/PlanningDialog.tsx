import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { countdownLabel } from "../format";

export const STAGE_LINES = [
  "Counting back from your date…",
  "Balancing the budget to the last rupee…",
  "Finding vendors worth calling…",
  "Adding ideas only you would love…",
] as const;

export const SLOW_LINE = "Still working. Good plans take a moment.";

const ROTATE_MS = 3_000;
const SLOW_AFTER_MS = 20_000;
const DIYA_COUNT = 8;

/** The line to show on screen: the current stage, or the "still working" line after 20 seconds. */
export function stageLine(stage: number, slow: boolean): string {
  return slow ? SLOW_LINE : (STAGE_LINES[stage % STAGE_LINES.length] ?? STAGE_LINES[0]);
}

/** Dots of the kolam grid: a ring-shaped patch of a square lattice around the centre. */
const DOTS: [number, number][] = [];
for (let x = -90; x <= 90; x += 20) {
  for (let y = -90; y <= 90; y += 20) {
    const distance = Math.hypot(x, y);
    if (distance >= 50 && distance <= 92) DOTS.push([130 + x, 130 + y]);
  }
}

const angleOf = (index: number, count: number) => (index / count) * Math.PI * 2;

const BURST = Array.from({ length: 12 }, (_, index) => {
  const angle = angleOf(index, 12);
  return { dx: Math.round(Math.sin(angle) * 118), dy: Math.round(-Math.cos(angle) * 118) };
});

interface PlanningDialogProps {
  open: boolean;
  /** Days from today to the event date. */
  daysToGo: number;
  /** True once the plan has arrived: the diyas glow and petals burst out. */
  done: boolean;
  onStop: () => void;
}

/** The waiting screen: a rangoli draws itself and eight diyas light up while the plan is drafted. */
export function PlanningDialog({ open, daysToGo, done, onStop }: PlanningDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stopRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [stage, setStage] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      stopRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setStage(0);
    setSlow(false);
    const rotate = setInterval(() => setStage((current) => current + 1), ROTATE_MS);
    const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => {
      clearInterval(rotate);
      clearTimeout(slowTimer);
    };
  }, [open]);

  const spoken = done
    ? "Your plan is ready."
    : slow
      ? SLOW_LINE
      : "Building your plan. This takes about 10 to 20 seconds.";

  return (
    <dialog ref={dialogRef} className="planning" aria-labelledby={titleId} onClose={onStop}>
      <div className={done ? "planning-body is-done" : "planning-body"}>
        <h2 id={titleId} className="planning-title">
          Drafting your plan
        </h2>
        <div className="rangoli">
          <svg viewBox="0 0 260 260" aria-hidden="true" focusable="false">
            <g className="kolam">
              {DOTS.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" />
              ))}
            </g>
            <g transform="translate(130 130)">
              {Array.from({ length: DIYA_COUNT }, (_, index) => (
                <path
                  key={`outer-${index}`}
                  className="petal"
                  pathLength="100"
                  d="M0 -22 C12 -38 12 -62 0 -78 C-12 -62 -12 -38 0 -22Z"
                  transform={`rotate(${index * 45})`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                />
              ))}
              {Array.from({ length: DIYA_COUNT }, (_, index) => (
                <path
                  key={`inner-${index}`}
                  className="petal petal-inner"
                  pathLength="100"
                  d="M0 -22 C8 -32 8 -46 0 -54 C-8 -46 -8 -32 0 -22Z"
                  transform={`rotate(${index * 45 + 22.5})`}
                  style={{ animationDelay: `${1.4 + index * 0.1}s` }}
                />
              ))}
            </g>
            <circle className="scrim" cx="130" cy="130" r="38" />
            {Array.from({ length: DIYA_COUNT }, (_, index) => {
              const angle = angleOf(index, DIYA_COUNT);
              const x = 130 + Math.sin(angle) * 108;
              const y = 130 - Math.cos(angle) * 108;
              const delay = 2.2 + index * 0.4;
              return (
                <g key={`diya-${index}`} className="diya" transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                  <circle className="glow" cy="-9" r="13" style={{ animationDelay: `${delay}s` }} />
                  <path className="flame" d="M0 -3 C-5 -9 -2 -15 0 -20 C2 -15 5 -9 0 -3Z" style={{ animationDelay: `${delay}s, ${delay + 0.5}s` }} />
                  <path className="bowl" d="M-9 0 H9 C9 8 4 12 0 12 C-4 12 -9 8 -9 0Z" />
                </g>
              );
            })}
            {done ? (
              <g className="burst" transform="translate(130 130)">
                {BURST.map((point, index) => (
                  <circle
                    key={index}
                    r="4"
                    style={{ "--dx": `${point.dx}px`, "--dy": `${point.dy}px` } as CSSProperties}
                  />
                ))}
              </g>
            ) : null}
          </svg>
          <p className="rangoli-days">{countdownLabel(daysToGo)}</p>
        </div>
        <p key={slow ? "slow" : stage} className="planning-line" aria-hidden="true">
          {stageLine(stage, slow)}
        </p>
        <p className="sr-only" role="status">
          {spoken}
        </p>
        <button ref={stopRef} type="button" className="btn btn-light" onClick={onStop} disabled={done}>
          Stop
        </button>
      </div>
    </dialog>
  );
}
