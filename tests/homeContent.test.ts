import { describe, expect, it } from "vitest";
import { EVENT_TYPES } from "../shared/schema";
import { EVENT_BLURBS, EXAMPLE, INDIA_CHIPS, TRUST_POINTS, exampleBudget } from "../src/homeContent";

describe("example plan", () => {
  it("adds up to exactly the example budget", () => {
    const total = exampleBudget().reduce((sum, item) => sum + item.amountInr, 0);
    expect(total).toBe(EXAMPLE.budgetInr);
  });

  it("has a split that already sums to 100 percent", () => {
    const percent = EXAMPLE.budget.reduce((sum, item) => sum + item.percent, 0);
    expect(percent).toBe(100);
  });
});

describe("home copy", () => {
  it("describes every event type the form supports", () => {
    expect(Object.keys(EVENT_BLURBS).sort()).toEqual([...EVENT_TYPES].sort());
  });

  it("keeps the honesty points the footer also promises", () => {
    const text = TRUST_POINTS.map((point) => `${point.title} ${point.text}`).join(" ");
    expect(text).toContain("add up to exactly your budget");
    expect(text).toContain("Estimates, not quotes");
    expect(text).toContain("Google Gemini");
  });

  it("lists unique India chips", () => {
    expect(new Set(INDIA_CHIPS).size).toBe(INDIA_CHIPS.length);
  });
});
