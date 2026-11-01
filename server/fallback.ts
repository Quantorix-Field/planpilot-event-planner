import { buildStarterPlan } from "../shared/starterPlan.js";
import { todayIst, type AiPlan, type PlanRequest } from "../shared/schema.js";
import { DEFAULT_MODEL, generateAiPlan, PlanGenerationError } from "./gemini.js";

/** Model ids go into the request URL, so only plain ids are accepted. */
const MODEL_ID = /^[a-z0-9][a-z0-9.-]{0,62}$/;
const MAX_MODELS = 3;

/** Serverless limit is 60 s; stay under it so the starter plan can always be returned. */
export const TOTAL_BUDGET_MS = 52_000;
const ATTEMPT_MS = 25_000;
const MIN_ATTEMPT_MS = 5_000;

/** Only "the AI is unavailable" errors lead to the next model or the starter plan. */
const OUTAGE_STATUSES = new Set([502, 503, 504]);

/** The main model first, then the backups from GEMINI_FALLBACK_MODELS (comma separated). */
export function parseModelList(primary: string | undefined, fallbacks: string | undefined): string[] {
  const clean = (value: string) => value.trim().toLowerCase();
  const first = clean(primary ?? "");
  const wanted = [
    MODEL_ID.test(first) ? first : DEFAULT_MODEL,
    ...(fallbacks ?? "").split(",").map(clean).filter((name) => MODEL_ID.test(name)),
  ];
  return [...new Set(wanted)].slice(0, MAX_MODELS);
}

export interface PlanResult {
  plan: AiPlan;
  source: "ai" | "starter";
}

export interface FallbackOptions {
  apiKey: string;
  models: string[];
  generate?: typeof generateAiPlan;
  fetchImpl?: typeof fetch;
  now?: () => number;
  budgetMs?: number;
}

/**
 * Tries each model in turn. If every model is unavailable, or time runs out, returns the
 * built-in starter plan. Problems with the request itself (a blocked prompt, for example)
 * and unexpected bugs are not hidden: they are thrown.
 */
export async function generatePlan(
  request: PlanRequest,
  options: FallbackOptions,
  today: string = todayIst(),
): Promise<PlanResult> {
  const generate = options.generate ?? generateAiPlan;
  const now = options.now ?? Date.now;
  const deadline = now() + (options.budgetMs ?? TOTAL_BUDGET_MS);

  for (const model of options.models) {
    const remaining = deadline - now();
    if (remaining < MIN_ATTEMPT_MS) break;
    try {
      const plan = await generate(
        request,
        {
          apiKey: options.apiKey,
          model,
          timeoutMs: Math.min(ATTEMPT_MS, remaining),
          ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
        },
        today,
      );
      return { plan, source: "ai" };
    } catch (error) {
      if (!(error instanceof PlanGenerationError) || !OUTAGE_STATUSES.has(error.status)) throw error;
      console.error(`Model ${model} was unavailable (status ${error.status})`);
    }
  }

  console.error("No AI model was available; serving the starter plan");
  return { plan: buildStarterPlan(request, today), source: "starter" };
}
