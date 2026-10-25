import { describe, expect, it } from "vitest";
import {
  aiPlanSchema,
  isValidIsoDate,
  planRequestSchema,
  todayIst,
} from "../shared/schema";
import { makeAiPlan, makeRequest } from "./fixtures";

describe("todayIst", () => {
  it("uses the India date, which is ahead of UTC late in the evening", () => {
    expect(todayIst(new Date("2026-10-21T20:00:00Z"))).toBe("2026-10-22");
  });

  it("matches the UTC date earlier in the day", () => {
    expect(todayIst(new Date("2026-10-21T10:00:00Z"))).toBe("2026-10-21");
  });
});

describe("isValidIsoDate", () => {
  const valid = ["2028-02-29", "2026-12-31", "2099-01-01"];
  const invalid = ["2026-02-29", "2026-13-01", "2026-00-10", "26-1-1", "", "2026/12/12", "2026-12-32"];

  for (const value of valid) {
    it(`accepts ${value}`, () => expect(isValidIsoDate(value)).toBe(true));
  }
  for (const value of invalid) {
    it(`rejects "${value}"`, () => expect(isValidIsoDate(value)).toBe(false));
  }
});

describe("planRequestSchema", () => {
  it("accepts a valid request and trims the city", () => {
    const result = planRequestSchema.safeParse(makeRequest({ city: "  Pune " }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.city).toBe("Pune");
  });

  it("defaults the optional notes to an empty string", () => {
    const { vibe: _omit, ...withoutVibe } = makeRequest();
    const result = planRequestSchema.safeParse(withoutVibe);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.vibe).toBe("");
  });

  it("allows an event today", () => {
    expect(planRequestSchema.safeParse(makeRequest({ eventDate: todayIst() })).success).toBe(true);
  });

  const rejected: [string, object][] = [
    ["unknown event type", { eventType: "party" }],
    ["past date", { eventDate: "2020-01-01" }],
    ["impossible date", { eventDate: "2099-02-30" }],
    ["zero guests", { guestCount: 0 }],
    ["too many guests", { guestCount: 5001 }],
    ["fractional guests", { guestCount: 12.5 }],
    ["guests as text", { guestCount: "200" }],
    ["budget below minimum", { budgetInr: 4999 }],
    ["budget above maximum", { budgetInr: 100_000_001 }],
    ["blank city", { city: "   " }],
    ["city too long", { city: "x".repeat(61) }],
    ["notes too long", { vibe: "x".repeat(501) }],
  ];
  for (const [label, patch] of rejected) {
    it(`rejects ${label}`, () => {
      expect(planRequestSchema.safeParse({ ...makeRequest(), ...patch }).success).toBe(false);
    });
  }
});

describe("aiPlanSchema", () => {
  it("accepts a well-formed plan", () => {
    expect(aiPlanSchema.safeParse(makeAiPlan()).success).toBe(true);
  });

  it("rejects plans with too few budget lines", () => {
    const plan = makeAiPlan();
    expect(aiPlanSchema.safeParse({ ...plan, budget: plan.budget.slice(0, 3) }).success).toBe(false);
  });

  it("rejects an unknown vendor priority", () => {
    const plan = makeAiPlan();
    const vendors = plan.vendors.map((v) => ({ ...v, priority: "urgent" }));
    expect(aiPlanSchema.safeParse({ ...plan, vendors }).success).toBe(false);
  });

  it("rejects fractional or negative timeline offsets", () => {
    const plan = makeAiPlan();
    const fractional = plan.timeline.map((t) => ({ ...t, daysBefore: 1.5 }));
    const negative = plan.timeline.map((t) => ({ ...t, daysBefore: -1 }));
    expect(aiPlanSchema.safeParse({ ...plan, timeline: fractional }).success).toBe(false);
    expect(aiPlanSchema.safeParse({ ...plan, timeline: negative }).success).toBe(false);
  });

  it("rejects missing sections", () => {
    expect(aiPlanSchema.safeParse({ summary: "only a summary" }).success).toBe(false);
  });
});
