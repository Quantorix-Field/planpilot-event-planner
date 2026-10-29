import { describe, expect, it } from "vitest";
import {
  MAX_PLANS,
  createPlan,
  deletePlan,
  getPlan,
  listPlans,
  updatePlan,
  type Clock,
} from "../src/planStore";
import { planIdSchema } from "../src/routes";
import type { StorageLike } from "../src/storage";
import { makePlanResponse, makeRequest } from "./fixtures";

function memoryStorage() {
  const data = new Map<string, string>();
  const storage: StorageLike = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
  return { data, storage };
}

const blocked: StorageLike = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("quota");
  },
  removeItem() {
    throw new Error("blocked");
  },
};

/** Each call moves the clock forward one second and hands out the next id. */
function makeClock(): Clock {
  let tick = 0;
  let counter = 0;
  return {
    now: () => new Date(Date.UTC(2026, 9, 29, 10, 0, tick++)),
    newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
  };
}

const input = () => ({ request: makeRequest(), plan: makePlanResponse() });

function create(storage: StorageLike, clock: Clock) {
  const result = createPlan(input(), storage, clock);
  if (!result.ok) throw new Error(`create failed: ${result.reason}`);
  return result.plan;
}

describe("creating and reading plans", () => {
  it("saves a plan and reads it back", () => {
    const { storage } = memoryStorage();
    const clock = makeClock();
    expect(listPlans(storage, clock)).toEqual([]);
    const created = create(storage, clock);
    expect(created.checked).toEqual([]);
    expect(created.createdAt).toBe(created.updatedAt);
    expect(listPlans(storage, clock)).toEqual([created]);
    expect(getPlan(created.id, storage, clock)).toEqual(created);
  });

  it("lists the newest plan first", () => {
    const { storage } = memoryStorage();
    const clock = makeClock();
    const first = create(storage, clock);
    const second = create(storage, clock);
    const third = create(storage, clock);
    expect(listPlans(storage, clock).map((plan) => plan.id)).toEqual([third.id, second.id, first.id]);
  });

  it("gives every plan a different valid id with the default clock", () => {
    const { storage } = memoryStorage();
    const a = createPlan(input(), storage);
    const b = createPlan(input(), storage);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(planIdSchema.safeParse(a.plan.id).success).toBe(true);
      expect(a.plan.id === b.plan.id).toBe(false);
    }
  });

  it("returns null for unknown or malformed ids", () => {
    const { storage } = memoryStorage();
    const clock = makeClock();
    create(storage, clock);
    expect(getPlan("00000000-0000-4000-8000-0000000000ff", storage, clock)).toBeNull();
    expect(getPlan("abc", storage, clock)).toBeNull();
    expect(getPlan("<script>", storage, clock)).toBeNull();
  });

  it("keeps a plan whose event date has already passed", () => {
    const { storage } = memoryStorage();
    const clock = makeClock();
    const created = createPlan({ request: makeRequest({ eventDate: "2020-01-01" }), plan: makePlanResponse() }, storage, clock);
    expect(created.ok).toBe(true);
    expect(listPlans(storage, clock).length).toBe(1);
  });

  it("refuses data that does not match the schema", () => {
    const { storage } = memoryStorage();
    const bad = createPlan({ request: makeRequest({ guestCount: -5 }), plan: makePlanResponse() }, storage, makeClock());
    expect(bad).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("the 20 plan limit", () => {
  it("accepts 20 plans, refuses the 21st, and has room again after a delete", () => {
    const { storage } = memoryStorage();
    const clock = makeClock();
    const made = Array.from({ length: MAX_PLANS }, () => create(storage, clock));
    expect(createPlan(input(), storage, clock)).toEqual({ ok: false, reason: "full" });
    expect(deletePlan(made[0]!.id, storage, clock)).toBe(true);
    expect(createPlan(input(), storage, clock).ok).toBe(true);
    expect(listPlans(storage, clock).length).toBe(MAX_PLANS);
  });
});

describe("updating and deleting", () => {
  it("updates the ticks and keeps the creation time", () => {
    const { storage } = memoryStorage();
    const clock = makeClock();
    const created = create(storage, clock);
    const updated = updatePlan(created.id, { checked: ["timeline-0", "vendor-1"] }, storage, clock);
    expect(updated?.checked).toEqual(["timeline-0", "vendor-1"]);
    expect(updated?.createdAt).toBe(created.createdAt);
    expect((updated?.updatedAt ?? "") > created.updatedAt).toBe(true);
    expect(getPlan(created.id, storage, clock)?.checked).toEqual(["timeline-0", "vendor-1"]);
  });

  it("replaces the request and plan when a plan is redrafted", () => {
    const { storage } = memoryStorage();
    const clock = makeClock();
    const created = create(storage, clock);
    const request = makeRequest({ city: "Pune", guestCount: 40 });
    const plan = makePlanResponse({ summary: "A new summary." });
    const updated = updatePlan(created.id, { request, plan, checked: [] }, storage, clock);
    expect(updated?.request.city).toBe("Pune");
    expect(updated?.plan.summary).toBe("A new summary.");
    expect(updated?.id).toBe(created.id);
    expect(listPlans(storage, clock).length).toBe(1);
  });

  it("rejects updates for unknown plans or invalid data", () => {
    const { storage } = memoryStorage();
    const clock = makeClock();
    const created = create(storage, clock);
    expect(updatePlan("00000000-0000-4000-8000-0000000000ff", { checked: [] }, storage, clock)).toBeNull();
    expect(updatePlan(created.id, { checked: Array.from({ length: 201 }, (_, i) => `t${i}`) }, storage, clock)).toBeNull();
    expect(getPlan(created.id, storage, clock)?.checked).toEqual([]);
  });

  it("deletes one plan and reports whether it existed", () => {
    const { storage } = memoryStorage();
    const clock = makeClock();
    const a = create(storage, clock);
    const b = create(storage, clock);
    expect(deletePlan(a.id, storage, clock)).toBe(true);
    expect(deletePlan(a.id, storage, clock)).toBe(false);
    expect(listPlans(storage, clock).map((plan) => plan.id)).toEqual([b.id]);
  });
});

describe("bad stored data", () => {
  it("ignores corrupted JSON, a wrong version and a wrong shape", () => {
    for (const raw of ["{corrupt", "[]", JSON.stringify({ version: 1, plans: [] }), JSON.stringify({ version: 2 })]) {
      const { data, storage } = memoryStorage();
      data.set("planpilot:v2", raw);
      expect(listPlans(storage, makeClock())).toEqual([]);
    }
  });

  it("drops only the bad entries, removes duplicates and caps the list", () => {
    const { data, storage } = memoryStorage();
    const clock = makeClock();
    const good = create(storage, clock);
    const stored = JSON.parse(data.get("planpilot:v2")!) as { version: 2; plans: unknown[] };
    const many = Array.from({ length: 30 }, (_, i) => ({
      ...good,
      id: `00000000-0000-4000-8000-${String(i + 100).padStart(12, "0")}`,
    }));
    stored.plans = [{ nope: 1 }, "text", good, good, { ...good, id: "not-a-uuid" }, ...many];
    data.set("planpilot:v2", JSON.stringify(stored));
    const plans = listPlans(storage, clock);
    expect(plans.length).toBe(MAX_PLANS);
    expect(new Set(plans.map((plan) => plan.id)).size).toBe(MAX_PLANS);
    expect(plans.some((plan) => plan.id === "not-a-uuid")).toBe(false);
  });

  it("rejects stored entries with a script in a date or an oversize tick list", () => {
    const { data, storage } = memoryStorage();
    const clock = makeClock();
    const good = create(storage, clock);
    const evil = { ...good, id: "00000000-0000-4000-8000-0000000000aa", request: { ...good.request, eventDate: "<script>" } };
    const long = { ...good, id: "00000000-0000-4000-8000-0000000000bb", checked: Array.from({ length: 300 }, () => "x") };
    data.set("planpilot:v2", JSON.stringify({ version: 2, plans: [evil, long] }));
    expect(listPlans(storage, clock)).toEqual([]);
  });
});

describe("moving the plan saved by the first version", () => {
  const v1 = () => JSON.stringify({ request: makeRequest(), plan: makePlanResponse(), checked: ["timeline-0"] });

  it("migrates it once and removes the old copy", () => {
    const { data, storage } = memoryStorage();
    const clock = makeClock();
    data.set("planpilot:v1", v1());
    const plans = listPlans(storage, clock);
    expect(plans.length).toBe(1);
    expect(plans[0]?.checked).toEqual(["timeline-0"]);
    expect(data.has("planpilot:v1")).toBe(false);
    expect(data.has("planpilot:v2")).toBe(true);
    expect(listPlans(storage, clock)[0]?.id).toBe(plans[0]?.id);
  });

  it("keeps a v1 plan even when its event date has passed", () => {
    const { data, storage } = memoryStorage();
    data.set("planpilot:v1", JSON.stringify({ request: makeRequest({ eventDate: "2020-01-01" }), plan: makePlanResponse(), checked: [] }));
    expect(listPlans(storage, makeClock()).length).toBe(1);
  });

  it("leaves an unreadable v1 value alone and starts empty", () => {
    const { data, storage } = memoryStorage();
    data.set("planpilot:v1", "{corrupt");
    expect(listPlans(storage, makeClock())).toEqual([]);
    expect(data.get("planpilot:v1")).toBe("{corrupt");
  });

  it("prefers the new store when both exist and never resurrects the old plan", () => {
    const { data, storage } = memoryStorage();
    const clock = makeClock();
    data.set("planpilot:v1", v1());
    const [migrated] = listPlans(storage, clock);
    deletePlan(migrated!.id, storage, clock);
    data.set("planpilot:v1", v1());
    expect(listPlans(storage, clock)).toEqual([]);
  });

  it("keeps the old copy when the new store cannot be written", () => {
    const data = new Map<string, string>([["planpilot:v1", v1()]]);
    const storage: StorageLike = {
      getItem: (key) => data.get(key) ?? null,
      setItem() {
        throw new Error("quota");
      },
      removeItem: (key) => {
        data.delete(key);
      },
    };
    expect(listPlans(storage, makeClock())).toEqual([]);
    expect(data.has("planpilot:v1")).toBe(true);
  });
});

describe("blocked or missing storage", () => {
  it("never throws", () => {
    const clock = makeClock();
    for (const storage of [blocked, null]) {
      expect(listPlans(storage, clock)).toEqual([]);
      expect(getPlan("00000000-0000-4000-8000-000000000001", storage, clock)).toBeNull();
      expect(createPlan(input(), storage, clock)).toEqual({ ok: false, reason: "unavailable" });
      expect(updatePlan("00000000-0000-4000-8000-000000000001", { checked: [] }, storage, clock)).toBeNull();
      expect(deletePlan("00000000-0000-4000-8000-000000000001", storage, clock)).toBe(false);
    }
  });
});
