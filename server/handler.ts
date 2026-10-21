import { finalizePlan } from "../shared/finalize.js";
import { planRequestSchema } from "../shared/schema.js";
import { generateAiPlan, PlanGenerationError } from "./gemini.js";
import { createRateLimiter, type RateLimiter } from "./rateLimit.js";

const MAX_BODY_CHARS = 10_000;
const defaultLimiter = createRateLimiter(10, 60_000);

export interface HandlerDeps {
  env?: Record<string, string | undefined>;
  generate?: typeof generateAiPlan;
  limiter?: RateLimiter;
}

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/** Validates the request, calls Gemini through our proxy, and returns the finalized plan. */
export async function handlePlanRequest(
  request: Request,
  deps: HandlerDeps = {},
): Promise<Response> {
  const env = deps.env ?? process.env;
  const generate = deps.generate ?? generateAiPlan;
  const limiter = deps.limiter ?? defaultLimiter;

  if (request.method !== "POST") {
    return json({ error: "Use POST." }, 405, { Allow: "POST" });
  }
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return json({ error: "Send JSON." }, 415);
  }

  const limit = limiter.check(clientKey(request));
  if (!limit.allowed) {
    return json(
      { error: "Too many requests. Please wait a moment and try again." },
      429,
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return json({ error: "The server is not configured yet." }, 500);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return json({ error: "Request is too large." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Request body is not valid JSON." }, 400);
  }

  const parsed = planRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  try {
    const aiPlan = await generate(parsed.data, {
      apiKey,
      ...(env.GEMINI_MODEL ? { model: env.GEMINI_MODEL } : {}),
    });
    return json(finalizePlan(aiPlan, parsed.data), 200);
  } catch (error) {
    if (error instanceof PlanGenerationError) {
      return json({ error: error.message }, error.status);
    }
    console.error("Plan generation failed:", error instanceof Error ? error.name : "unknown");
    return json({ error: "Something went wrong while building your plan." }, 500);
  }
}
