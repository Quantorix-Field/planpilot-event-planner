import { z } from "zod";
import {
  planRequestSchema,
  planResponseSchema,
  type PlanRequest,
  type PlanResponse,
} from "../shared/schema";

const KEY = "planpilot:v1";

const savedSchema = z.object({
  request: planRequestSchema,
  plan: planResponseSchema,
  checked: z.array(z.string().max(40)).max(200),
});

export interface SavedPlan {
  request: PlanRequest;
  plan: PlanResponse;
  checked: string[];
}

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Browser storage if it is available (it can be blocked in private modes). */
export function getStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Loads the last plan. Anything missing, corrupted, or for a past date is ignored. */
export function loadSaved(storage: StorageLike | null = getStorage()): SavedPlan | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const parsed = savedSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function savePlan(saved: SavedPlan, storage: StorageLike | null = getStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Storage full or blocked: the plan still works, it just won't be remembered.
  }
}

export function clearSaved(storage: StorageLike | null = getStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}

/** Returns a new list with `id` added, or removed if it was already there. */
export function toggleChecked(checked: string[], id: string): string[] {
  return checked.includes(id) ? checked.filter((c) => c !== id) : [...checked, id];
}
