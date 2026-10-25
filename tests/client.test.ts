import { describe, expect, it } from "vitest";
import { ApiError, requestPlan } from "../src/api";
import { countChecked, itemId } from "../src/checklist";
import { countdownLabel, dueLabel, formatDate, formatInr } from "../src/format";
import {
  EMPTY_VALUES,
  parseForm,
  serverErrorsToForm,
  valuesFromRequest,
  type FormValues,
} from "../src/formUtils";
import {
  clearSaved,
  loadSaved,
  savePlan,
  toggleChecked,
  type SavedPlan,
  type StorageLike,
} from "../src/storage";
import { TAB_IDS, nextTabIndex } from "../src/tabs";
import { makePlanResponse, makeRequest } from "./fixtures";

function reply(body: unknown, status = 200): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
}

function fakeFetch(result: Response | Error) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (result instanceof Error) throw result;
    return result;
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

async function expectApiError(promise: Promise<unknown>, status: number, message?: RegExp) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(status);
  if (message) expect((error as ApiError).message).toMatch(message);
  return error as ApiError;
}

describe("requestPlan", () => {
  it("posts the form data as JSON and returns the validated plan", async () => {
    const plan = makePlanResponse();
    const { fetchImpl, calls } = fakeFetch(reply(plan));
    const request = makeRequest();
    expect(await requestPlan(request, fetchImpl)).toEqual(plan);
    expect(calls[0]?.url).toBe("/api/plan");
    expect(calls[0]?.init.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual(request);
  });

  it("explains a network failure", async () => {
    const { fetchImpl } = fakeFetch(new TypeError("offline"));
    await expectApiError(requestPlan(makeRequest(), fetchImpl), 0, /reach the server/);
  });

  it("shows the server's message for error responses", async () => {
    const { fetchImpl } = fakeFetch(reply({ error: "The AI took too long." }, 504));
    await expectApiError(requestPlan(makeRequest(), fetchImpl), 504, /took too long/);
  });

  it("falls back to a generic message when the error body is not ours", async () => {
    const { fetchImpl } = fakeFetch(reply("<html>bad gateway</html>", 502));
    await expectApiError(requestPlan(makeRequest(), fetchImpl), 502, /Something went wrong/);
  });

  it("rejects success responses that do not match the plan schema", async () => {
    for (const bad of [{ nonsense: true }, "not json", { ...makePlanResponse(), budget: "x" }]) {
      const { fetchImpl } = fakeFetch(reply(bad));
      await expectApiError(requestPlan(makeRequest(), fetchImpl), 502, /unexpected/);
    }
  });

  it("keeps field errors from the server", async () => {
    const body = { error: "Fix it", fieldErrors: { guestCount: ["At least 1 guest."] } };
    const { fetchImpl } = fakeFetch(reply(body, 400));
    const error = await expectApiError(requestPlan(makeRequest(), fetchImpl), 400);
    expect(error.fieldErrors.guestCount).toEqual(["At least 1 guest."]);
  });

  it("gives up when the server never answers", async () => {
    const keepAlive = setTimeout(() => undefined, 3000);
    const hanging = ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      })) as unknown as typeof fetch;
    await expectApiError(requestPlan(makeRequest(), hanging, 40), 0);
    clearTimeout(keepAlive);
  });
});

describe("formatting", () => {
  it("formats rupees the Indian way", () => {
    expect(formatInr(1_500_000)).toBe("₹15,00,000");
    expect(formatInr(77_777)).toBe("₹77,777");
    expect(formatInr(0)).toBe("₹0");
  });

  it("formats dates", () => {
    expect(formatDate("2026-12-12")).toBe("12 Dec 2026");
    expect(formatDate("2027-01-01")).toBe("1 Jan 2027");
  });

  it("describes due dates in plain words", () => {
    expect(dueLabel("2026-10-21", "2026-10-21")).toBe("Today");
    expect(dueLabel("2026-10-22", "2026-10-21")).toBe("Tomorrow");
    expect(dueLabel("2026-11-01", "2026-10-21")).toBe("In 11 days");
    expect(dueLabel("2026-10-20", "2026-10-21")).toBe("Overdue");
  });

  it("describes the event countdown", () => {
    expect(countdownLabel(-3)).toBe("This date has passed");
    expect(countdownLabel(0)).toBe("Today is the day!");
    expect(countdownLabel(1)).toBe("Tomorrow");
    expect(countdownLabel(52)).toBe("52 days to go");
  });
});

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

describe("saved plan storage", () => {
  const saved: SavedPlan = { request: makeRequest(), plan: makePlanResponse(), checked: ["timeline-0"] };

  it("saves, loads and clears a plan", () => {
    const { storage } = memoryStorage();
    expect(loadSaved(storage)).toBeNull();
    savePlan(saved, storage);
    expect(loadSaved(storage)).toEqual(saved);
    clearSaved(storage);
    expect(loadSaved(storage)).toBeNull();
  });

  it("ignores corrupted, malformed or expired data", () => {
    const { data, storage } = memoryStorage();
    data.set("planpilot:v1", "{corrupt");
    expect(loadSaved(storage)).toBeNull();
    data.set("planpilot:v1", JSON.stringify({ request: saved.request, plan: { nope: 1 }, checked: [] }));
    expect(loadSaved(storage)).toBeNull();
    data.set("planpilot:v1", JSON.stringify({ ...saved, request: { ...saved.request, eventDate: "2020-01-01" } }));
    expect(loadSaved(storage)).toBeNull();
  });

  it("never throws when storage is blocked or full", () => {
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
    expect(loadSaved(blocked)).toBeNull();
    savePlan(saved, blocked);
    clearSaved(blocked);
    expect(loadSaved(null)).toBeNull();
    savePlan(saved, null);
    clearSaved(null);
  });

  it("toggles ticked items without changing the original list", () => {
    const original = ["a"];
    expect(toggleChecked(original, "b")).toEqual(["a", "b"]);
    expect(toggleChecked(["a", "b"], "a")).toEqual(["b"]);
    expect(original).toEqual(["a"]);
  });
});

describe("checklist and tabs helpers", () => {
  it("builds stable ids and counts ticked rows", () => {
    expect(itemId("timeline", 3)).toBe("timeline-3");
    expect(countChecked("timeline", 5, ["timeline-0", "timeline-4", "vendor-1"])).toBe(2);
    expect(countChecked("vendor", 5, ["vendor-1", "vendor-1"])).toBe(1);
    expect(countChecked("timeline", 2, ["timeline-0", "timeline-4"])).toBe(1);
    expect(countChecked("timeline", 0, ["timeline-0"])).toBe(0);
  });

  it("moves between tabs with the arrow, Home and End keys", () => {
    expect(TAB_IDS).toHaveLength(4);
    expect(nextTabIndex(0, "ArrowRight", 4)).toBe(1);
    expect(nextTabIndex(3, "ArrowRight", 4)).toBe(0);
    expect(nextTabIndex(0, "ArrowLeft", 4)).toBe(3);
    expect(nextTabIndex(2, "Home", 4)).toBe(0);
    expect(nextTabIndex(1, "End", 4)).toBe(3);
  });

  it("ignores keys that are not for tab navigation", () => {
    for (const key of ["Enter", " ", "ArrowDown", "ArrowUp", "a", "Tab"]) {
      expect(nextTabIndex(1, key, 4)).toBeNull();
    }
  });
});

describe("form parsing", () => {
  const filled: FormValues = {
    eventType: "birthday",
    eventDate: "2099-01-01",
    guestCount: "40",
    budgetInr: "80000",
    city: " Pune ",
    vibe: "",
  };

  it("turns form text into a validated request", () => {
    const result = parseForm(filled);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.city).toBe("Pune");
      expect(result.data.guestCount).toBe(40);
      expect(result.data.budgetInr).toBe(80_000);
    }
  });

  it("gives a friendly message for every empty required field", () => {
    const result = parseForm(EMPTY_VALUES);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.eventType).toBe("Choose an event type.");
      expect(result.errors.eventDate).toBe("Enter a valid date.");
      expect(result.errors.guestCount).toBe("Enter the number of guests.");
      expect(result.errors.budgetInr).toBe("Enter your budget in rupees.");
      expect(result.errors.city).toBe("Enter a city.");
      expect(result.errors.vibe).toBeUndefined();
    }
  });

  it("explains out-of-range, fractional and non-numeric values", () => {
    const messages = (patch: Partial<FormValues>) => {
      const result = parseForm({ ...filled, ...patch });
      return result.ok ? {} : result.errors;
    };
    expect(messages({ guestCount: "0" }).guestCount).toBe("At least 1 guest.");
    expect(messages({ guestCount: "6000" }).guestCount).toBe("Maximum 5,000 guests.");
    expect(messages({ guestCount: "12.5" }).guestCount).toBe("Guests must be a whole number.");
    expect(messages({ guestCount: "abc" }).guestCount).toBe("Enter the number of guests.");
    expect(messages({ budgetInr: "100" }).budgetInr).toMatch(/Minimum budget/);
    expect(messages({ eventDate: "2020-01-01" }).eventDate).toMatch(/past/);
    expect(messages({ city: "   " }).city).toBe("Enter a city.");
    expect(messages({ vibe: "x".repeat(501) }).vibe).toBeDefined();
  });

  it("round-trips a request through form values", () => {
    const request = makeRequest({ vibe: "v" });
    expect(valuesFromRequest(request)).toEqual({
      eventType: "wedding",
      eventDate: "2099-12-12",
      guestCount: "150",
      budgetInr: "1500000",
      city: "Jaipur",
      vibe: "v",
    });
  });

  it("maps server field errors onto known fields only", () => {
    const mapped = serverErrorsToForm({ city: ["bad", "worse"], hacker: ["no"], guestCount: [] });
    expect(mapped).toEqual({ city: "bad" });
  });
});
