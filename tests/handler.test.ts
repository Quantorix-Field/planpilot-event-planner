import { describe, expect, it } from "vitest";
import { POST } from "../api/plan";
import { handlePlanRequest, type HandlerDeps } from "../server/handler";
import { PlanGenerationError } from "../server/gemini";
import { createRateLimiter } from "../server/rateLimit";
import { planResponseSchema } from "../shared/schema";
import { makeAiPlan, makeRequest } from "./fixtures";

type Generate = NonNullable<HandlerDeps["generate"]>;

function post(body: unknown, headers: Record<string, string> = {}, raw?: string): Request {
  return new Request("https://example.test/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.1.1.1", ...headers },
    body: raw ?? JSON.stringify(body),
  });
}

function setup(generate?: Generate) {
  const state = { calls: 0, request: undefined as unknown, config: undefined as unknown };
  const fake: Generate = async (request, config) => {
    state.calls += 1;
    state.request = request;
    state.config = config;
    return makeAiPlan();
  };
  const deps: HandlerDeps = {
    env: { GEMINI_API_KEY: "K", GEMINI_MODEL: "m1" },
    generate: generate ?? fake,
    limiter: createRateLimiter(1000, 60_000),
  };
  return { deps, state };
}

const body = async (response: Response) => (await response.json()) as Record<string, unknown>;

describe("handlePlanRequest: request checks", () => {
  it("only accepts POST", async () => {
    const { deps } = setup();
    const response = await handlePlanRequest(new Request("https://example.test", { method: "GET" }), deps);
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
  });

  it("requires a JSON content type", async () => {
    const { deps } = setup();
    const response = await handlePlanRequest(post(makeRequest(), { "content-type": "text/plain" }), deps);
    expect(response.status).toBe(415);
  });

  it("rejects malformed JSON, oversized bodies and invalid fields without calling the AI", async () => {
    const { deps, state } = setup();
    expect((await handlePlanRequest(post(null, {}, "{oops"), deps)).status).toBe(400);
    expect((await handlePlanRequest(post(makeRequest({ vibe: "x".repeat(10_001) })), deps)).status).toBe(413);
    expect((await handlePlanRequest(post("just a string"), deps)).status).toBe(400);
    expect((await handlePlanRequest(post({ ...makeRequest(), eventType: "party" }), deps)).status).toBe(400);
    expect(state.calls).toBe(0);
  });

  it("returns per-field errors for invalid input", async () => {
    const { deps } = setup();
    const response = await handlePlanRequest(
      post({ ...makeRequest(), guestCount: 0, eventDate: "2020-01-01" }),
      deps,
    );
    const data = await body(response);
    expect(response.status).toBe(400);
    expect(Object.keys(data.fieldErrors as object).sort()).toEqual(["eventDate", "guestCount"]);
  });

  it("reports a missing API key without revealing details", async () => {
    const { deps, state } = setup();
    const response = await handlePlanRequest(post(makeRequest()), { ...deps, env: {} });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await body(response))).not.toContain("GEMINI");
    expect(state.calls).toBe(0);
  });
});

describe("handlePlanRequest: success and errors", () => {
  it("returns a validated plan with exact budget math and safe headers", async () => {
    const { deps, state } = setup();
    const response = await handlePlanRequest(post(makeRequest({ city: " Delhi ", budgetInr: 77_777 })), deps);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    const plan = planResponseSchema.parse(await response.json());
    expect(plan.budget.reduce((sum, row) => sum + row.amountInr, 0)).toBe(77_777);
    expect(state.request).toMatchObject({ city: "Delhi" });
    expect(state.config).toEqual({ apiKey: "K", model: "m1" });
  });

  it("omits the model when none is configured", async () => {
    const { deps, state } = setup();
    await handlePlanRequest(post(makeRequest()), { ...deps, env: { GEMINI_API_KEY: "K" } });
    expect(state.config).toEqual({ apiKey: "K" });
  });

  it("passes through safe errors from the AI client", async () => {
    const { deps } = setup(async () => {
      throw new PlanGenerationError("The AI took too long.", 504);
    });
    const response = await handlePlanRequest(post(makeRequest()), deps);
    expect(response.status).toBe(504);
    expect((await body(response)).error).toBe("The AI took too long.");
  });

  it("hides the details of unexpected errors", async () => {
    const { deps } = setup(async () => {
      throw new Error("secret stack trace with key K");
    });
    const response = await handlePlanRequest(post(makeRequest()), deps);
    expect(response.status).toBe(500);
    expect(JSON.stringify(await body(response))).not.toContain("secret");
  });

  it("returns 500 if the AI's budget cannot be turned into amounts", async () => {
    const plan = makeAiPlan();
    const zeroed = { ...plan, budget: plan.budget.map((row) => ({ ...row, percent: 0 })) };
    const { deps } = setup(async () => zeroed);
    expect((await handlePlanRequest(post(makeRequest()), deps)).status).toBe(500);
  });
});

describe("rate limiting", () => {
  it("allows a burst up to the limit, then answers 429 with Retry-After", async () => {
    const { deps } = setup();
    const limited = { ...deps, limiter: createRateLimiter(2, 60_000) };
    expect((await handlePlanRequest(post(makeRequest()), limited)).status).toBe(200);
    expect((await handlePlanRequest(post(makeRequest()), limited)).status).toBe(200);
    const blocked = await handlePlanRequest(post(makeRequest()), limited);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    const other = await handlePlanRequest(post(makeRequest(), { "x-forwarded-for": "9.9.9.9, 1.1.1.1" }), limited);
    expect(other.status).toBe(200);
  });
});

describe("createRateLimiter", () => {
  it("counts per key and resets after the window", () => {
    let now = 1000;
    const limiter = createRateLimiter(3, 60_000, () => now);
    expect([1, 2, 3].every(() => limiter.check("a").allowed)).toBe(true);
    const blocked = limiter.check("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(60);
    expect(limiter.check("b").allowed).toBe(true);
    now += 30_000;
    expect(limiter.check("a").retryAfterSec).toBe(30);
    now += 30_000;
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("drops expired keys so memory stays bounded", () => {
    let now = 0;
    const limiter = createRateLimiter(1, 10, () => now);
    for (let i = 0; i < 1500; i++) limiter.check(`key-${i}`);
    now = 100;
    expect(limiter.check("fresh").allowed).toBe(true);
  });
});

describe("api/plan endpoint", () => {
  it("answers with JSON instead of crashing when the server key is missing", async () => {
    const saved = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const response = await POST(post(makeRequest(), { "x-forwarded-for": "7.7.7.7" }));
      expect(response.status).toBe(500);
    } finally {
      if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
    }
  });
});
