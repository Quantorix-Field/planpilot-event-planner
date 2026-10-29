import { describe, expect, it } from "vitest";
import { planProgress, planTitle } from "../src/planSummary";
import { makePlanResponse, makeRequest } from "./fixtures";

describe("planTitle", () => {
  it("joins the event type and the city", () => {
    expect(planTitle(makeRequest())).toBe("Wedding, Jaipur");
    expect(planTitle(makeRequest({ eventType: "birthday", city: "Pune" }))).toBe("Birthday, Pune");
    expect(planTitle(makeRequest({ eventType: "community", city: "Kochi" }))).toBe("Community event, Kochi");
  });
});

describe("planProgress", () => {
  const plan = makePlanResponse();

  it("counts nothing when nothing is ticked", () => {
    expect(planProgress({ plan, checked: [] })).toEqual({
      tasksDone: 0,
      tasksTotal: plan.timeline.length,
      vendorsDone: 0,
      vendorsTotal: plan.vendors.length,
    });
  });

  it("counts ticked tasks and vendors separately", () => {
    const progress = planProgress({ plan, checked: ["timeline-0", "timeline-1", "vendor-0"] });
    expect(progress.tasksDone).toBe(2);
    expect(progress.vendorsDone).toBe(1);
  });

  it("ignores ticks that point past the end of a list", () => {
    const progress = planProgress({ plan, checked: ["timeline-99", "vendor-99", "other-1"] });
    expect(progress.tasksDone).toBe(0);
    expect(progress.vendorsDone).toBe(0);
  });
});
