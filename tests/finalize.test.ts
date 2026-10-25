import { describe, expect, it } from "vitest";
import {
  addDays,
  buildTimeline,
  daysBetween,
  finalizePlan,
  normalizeBudget,
  sortVendors,
} from "../shared/finalize";
import { makeAiPlan, makeRequest } from "./fixtures";

const budgetOf = (percents: number[]) =>
  percents.map((percent, i) => ({ category: `c${i}`, percent, note: "n" }));
const total = (rows: { amountInr: number }[]) => rows.reduce((sum, r) => sum + r.amountInr, 0);

describe("dates", () => {
  it("counts days between dates", () => {
    expect(daysBetween("2026-10-21", "2026-11-01")).toBe(11);
    expect(daysBetween("2026-10-21", "2026-10-21")).toBe(0);
    expect(daysBetween("2026-10-21", "2026-10-20")).toBe(-1);
  });

  it("handles leap years and clock changes", () => {
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
  });

  it("adds and subtracts days across month and year boundaries", () => {
    expect(addDays("2026-11-01", -11)).toBe("2026-10-21");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });
});

describe("normalizeBudget", () => {
  it("makes the amounts add up to exactly the budget", () => {
    expect(total(normalizeBudget(budgetOf([33.3, 33.3, 33.3, 0.1]), 100_000))).toBe(100_000);
  });

  it("splits remainders with the largest-remainder method", () => {
    const rows = normalizeBudget(budgetOf([1, 1, 1]), 100);
    expect(rows.map((r) => r.amountInr)).toEqual([34, 33, 33]);
  });

  it("rescales percentages that do not add up to 100", () => {
    const small = normalizeBudget(budgetOf([50, 30, 10, 5]), 1_000_000);
    expect(total(small)).toBe(1_000_000);
    const big = normalizeBudget(budgetOf([200, 100, 100, 100]), 5000);
    expect(big[0]?.amountInr).toBe(2000);
    expect(big[0]?.percent).toBe(40);
  });

  it("allows zero-percent lines", () => {
    const rows = normalizeBudget(budgetOf([0, 0, 0, 10]), 7777);
    expect(rows.map((r) => r.amountInr)).toEqual([0, 0, 0, 7777]);
  });

  it("rejects all-zero percentages", () => {
    expect(() => normalizeBudget(budgetOf([0, 0, 0, 0]), 5000)).toThrow(/more than zero/);
  });

  it("always sums exactly and stays within one rupee of the ideal split (5,000 random cases)", () => {
    let seed = 12345;
    const random = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    for (let run = 0; run < 5000; run++) {
      const count = 4 + Math.floor(random() * 9);
      const percents = Array.from({ length: count }, () => Math.round(random() * 10_000) / 100);
      if (percents.every((p) => p === 0)) continue;
      const budget = 5000 + Math.floor(random() * 99_995_000);
      const rows = normalizeBudget(budgetOf(percents), budget);
      expect(total(rows)).toBe(budget);
      const sum = percents.reduce((a, b) => a + b, 0);
      rows.forEach((row, i) => {
        expect(row.amountInr).toBeGreaterThanOrEqual(0);
        expect(Math.abs(row.amountInr - ((percents[i] ?? 0) / sum) * budget)).toBeLessThan(1);
      });
    }
  });
});

describe("buildTimeline", () => {
  const items = (offsets: number[]) => offsets.map((daysBefore, i) => ({ daysBefore, task: `t${i}` }));

  it("turns offsets into dates sorted soonest first", () => {
    const rows = buildTimeline(items([0, 30, 5, 60]), "2026-12-31", "2026-10-21");
    const dates = rows.map((r) => r.dueDate);
    expect(dates).toEqual([...dates].sort());
    expect(rows[rows.length - 1]?.dueDate).toBe("2026-12-31");
  });

  it("moves tasks that would already be overdue to today instead of dropping them", () => {
    const rows = buildTimeline(items([100, 5]), "2026-12-31", "2026-10-21");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.dueDate).toBe("2026-10-21");
    expect(rows[0]?.daysBefore).toBe(71);
  });

  it("puts everything on the same day when the event is today", () => {
    const rows = buildTimeline(items([0, 1, 2]), "2026-10-21", "2026-10-21");
    expect(rows.every((r) => r.dueDate === "2026-10-21" && r.daysBefore === 0)).toBe(true);
  });
});

describe("sortVendors", () => {
  it("lists must-book first, then recommended, then optional, keeping AI order within a group", () => {
    const sorted = sortVendors(makeAiPlan().vendors);
    expect(sorted.map((v) => v.name)).toEqual(["Venue", "Caterer", "Photographer", "DJ"]);
  });

  it("does not change the original list", () => {
    const original = makeAiPlan().vendors;
    sortVendors(original);
    expect(original[0]?.name).toBe("DJ");
  });
});

describe("finalizePlan", () => {
  const request = makeRequest({ eventType: "birthday", eventDate: "2026-11-21", budgetInr: 80_000 });

  it("combines the AI plan with exact math", () => {
    const plan = finalizePlan(makeAiPlan(), request, "2026-10-21");
    expect(plan.daysUntilEvent).toBe(31);
    expect(total(plan.budget)).toBe(80_000);
    expect(plan.vendors[0]?.priority).toBe("must-book");
    expect(plan.timeline[0]?.dueDate).toBe("2026-10-21");
  });

  it("refuses a date in the past", () => {
    expect(() => finalizePlan(makeAiPlan(), request, "2026-12-01")).toThrow(/past/);
  });
});
