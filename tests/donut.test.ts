import { describe, expect, it } from "vitest";
import { DONUT_GAP, dashFor, donutArcs } from "../src/donut";

describe("donutArcs", () => {
  it("splits the ring by share and leaves a gap after each arc", () => {
    const arcs = donutArcs([50, 30, 20]);
    expect(arcs.map((arc) => arc.share)).toEqual([50, 30, 20]);
    expect(arcs.map((arc) => arc.start)).toEqual([0, 50, 80]);
    expect(arcs.map((arc) => arc.length)).toEqual([49.2, 29.2, 19.2]);
  });

  it("covers the whole ring once the gaps are added back", () => {
    const arcs = donutArcs([30, 35, 15, 10, 10]);
    const covered = arcs.reduce((sum, arc) => sum + arc.length + DONUT_GAP, 0);
    expect(covered).toBeCloseTo(100, 1);
  });

  it("works with any scale of numbers, not only percentages", () => {
    const arcs = donutArcs([450_000, 525_000, 225_000]);
    expect(arcs.map((arc) => arc.share)).toEqual([37.5, 43.75, 18.75]);
  });

  it("draws a single slice as a full ring with no gap", () => {
    expect(donutArcs([80])).toEqual([{ start: 0, length: 100, share: 100 }]);
  });

  it("treats zero, negative and invalid amounts as empty slices", () => {
    const arcs = donutArcs([60, 0, -5, Number.NaN, 40]);
    expect(arcs.map((arc) => arc.share)).toEqual([60, 0, 0, 0, 40]);
    expect(arcs[1]?.length).toBe(0);
    expect(arcs[4]?.start).toBe(60);
  });

  it("returns nothing when there is nothing to draw", () => {
    expect(donutArcs([])).toEqual([]);
    expect(donutArcs([0, 0])).toEqual([]);
  });
});

describe("dashFor", () => {
  it("draws the arc, then leaves the rest empty, starting at the arc's position", () => {
    expect(dashFor({ start: 50, length: 29.2, share: 30 })).toEqual({
      strokeDasharray: "29.2 70.8",
      strokeDashoffset: -50,
    });
  });
});
