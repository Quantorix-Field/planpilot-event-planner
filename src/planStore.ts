import { z } from "zod";
import {
  isValidIsoDate,
  planRequestSchema,
  planResponseSchema,
  type PlanRequest,
  type PlanResponse,
} from "../shared/schema";
import { planIdSchema } from "./routes";
import { getStorage, type StorageLike } from "./storage";

export const MAX_PLANS = 20;

const KEY_V2 = "planpilot:v2";
const KEY_V1 = "planpilot:v1";

/** A saved plan keeps its request as typed, even after the event date has passed. */
const storedRequestSchema = planRequestSchema.extend({
  eventDate: z.string().refine(isValidIsoDate, "Enter a valid date."),
});

const storedPlanSchema = z.object({
  id: planIdSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  request: storedRequestSchema,
  plan: planResponseSchema,
  checked: z.array(z.string().max(40)).max(200),
});

export type StoredPlan = z.infer<typeof storedPlanSchema>;

const envelopeSchema = z.object({ version: z.literal(2), plans: z.array(z.unknown()) });

const v1Schema = z.object({
  request: storedRequestSchema,
  plan: planResponseSchema,
  checked: z.array(z.string().max(40)).max(200),
});

/** Time and id sources, replaceable in tests. */
export interface Clock {
  now: () => Date;
  newId: () => string;
}

function randomId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const systemClock: Clock = { now: () => new Date(), newId: randomId };

export type SaveResult =
  | { ok: true; plan: StoredPlan }
  | { ok: false; reason: "full" | "unavailable" | "invalid" };

function newestFirst(plans: StoredPlan[]): StoredPlan[] {
  return [...plans].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
}

/** Reads the v2 store. Returns null when the key does not exist yet. Bad entries are dropped. */
function parseStored(raw: string | null): StoredPlan[] | null {
  if (raw === null) return null;
  try {
    const envelope = envelopeSchema.safeParse(JSON.parse(raw));
    if (!envelope.success) return [];
    const seen = new Set<string>();
    const plans: StoredPlan[] = [];
    for (const item of envelope.data.plans) {
      const parsed = storedPlanSchema.safeParse(item);
      if (!parsed.success || seen.has(parsed.data.id)) continue;
      seen.add(parsed.data.id);
      plans.push(parsed.data);
      if (plans.length >= MAX_PLANS) break;
    }
    return plans;
  } catch {
    return [];
  }
}

function writePlans(plans: StoredPlan[], storage: StorageLike): boolean {
  try {
    storage.setItem(KEY_V2, JSON.stringify({ version: 2, plans }));
    return true;
  } catch {
    return false;
  }
}

/** Moves the single plan saved by the first version into the new store. */
function migrateV1(storage: StorageLike, clock: Clock): StoredPlan[] {
  try {
    const raw = storage.getItem(KEY_V1);
    if (!raw) return [];
    const parsed = v1Schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    const stamp = clock.now().toISOString();
    const migrated: StoredPlan = { id: clock.newId(), createdAt: stamp, updatedAt: stamp, ...parsed.data };
    const valid = storedPlanSchema.safeParse(migrated);
    if (!valid.success || !writePlans([valid.data], storage)) return [];
    try {
      storage.removeItem(KEY_V1);
    } catch {
      // The old copy stays, but the new store already exists, so it is never migrated twice.
    }
    return [valid.data];
  } catch {
    return [];
  }
}

function readPlans(storage: StorageLike, clock: Clock): StoredPlan[] {
  try {
    const stored = parseStored(storage.getItem(KEY_V2));
    return newestFirst(stored ?? migrateV1(storage, clock));
  } catch {
    return [];
  }
}

/** All saved plans, newest first. Never throws. */
export function listPlans(storage: StorageLike | null = getStorage(), clock: Clock = systemClock): StoredPlan[] {
  return storage ? readPlans(storage, clock) : [];
}

export function getPlan(
  id: string,
  storage: StorageLike | null = getStorage(),
  clock: Clock = systemClock,
): StoredPlan | null {
  if (!planIdSchema.safeParse(id).success) return null;
  return listPlans(storage, clock).find((plan) => plan.id === id) ?? null;
}

export function createPlan(
  input: { request: PlanRequest; plan: PlanResponse; checked?: string[] },
  storage: StorageLike | null = getStorage(),
  clock: Clock = systemClock,
): SaveResult {
  if (!storage) return { ok: false, reason: "unavailable" };
  const plans = readPlans(storage, clock);
  if (plans.length >= MAX_PLANS) return { ok: false, reason: "full" };
  const stamp = clock.now().toISOString();
  const parsed = storedPlanSchema.safeParse({
    id: clock.newId(),
    createdAt: stamp,
    updatedAt: stamp,
    request: input.request,
    plan: input.plan,
    checked: input.checked ?? [],
  });
  if (!parsed.success) return { ok: false, reason: "invalid" };
  if (!writePlans([...plans, parsed.data], storage)) return { ok: false, reason: "unavailable" };
  return { ok: true, plan: parsed.data };
}

/** Changes part of a saved plan (for example the ticks, or a redrafted plan). Null if it failed. */
export function updatePlan(
  id: string,
  patch: Partial<Pick<StoredPlan, "request" | "plan" | "checked">>,
  storage: StorageLike | null = getStorage(),
  clock: Clock = systemClock,
): StoredPlan | null {
  if (!storage) return null;
  const plans = readPlans(storage, clock);
  const index = plans.findIndex((plan) => plan.id === id);
  const current = plans[index];
  if (!current) return null;
  const parsed = storedPlanSchema.safeParse({ ...current, ...patch, updatedAt: clock.now().toISOString() });
  if (!parsed.success) return null;
  plans[index] = parsed.data;
  return writePlans(plans, storage) ? parsed.data : null;
}

/** True when the plan existed and is now gone. */
export function deletePlan(
  id: string,
  storage: StorageLike | null = getStorage(),
  clock: Clock = systemClock,
): boolean {
  if (!storage) return false;
  const plans = readPlans(storage, clock);
  const remaining = plans.filter((plan) => plan.id !== id);
  if (remaining.length === plans.length) return false;
  return writePlans(remaining, storage);
}
