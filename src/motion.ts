import { z } from "zod";
import { getStorage, type StorageLike } from "./storage";

const KEY = "planpilot:motion";
const motionSchema = z.enum(["on", "off"]);

export type MotionPref = z.infer<typeof motionSchema>;

/** The saved choice. Missing, corrupted or blocked storage means animations stay on. */
export function readMotion(storage: StorageLike | null = getStorage()): MotionPref {
  if (!storage) return "on";
  try {
    const parsed = motionSchema.safeParse(storage.getItem(KEY));
    return parsed.success ? parsed.data : "on";
  } catch {
    return "on";
  }
}

export function saveMotion(pref: MotionPref, storage: StorageLike | null = getStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(KEY, pref);
  } catch {
    // Blocked or full: the choice still applies until the page closes.
  }
}

type AttributeTarget = Pick<Element, "setAttribute" | "removeAttribute">;

/** Writes the choice to <html data-motion="off">, which theme.css uses to stop all motion. */
export function applyMotion(pref: MotionPref, root: AttributeTarget = document.documentElement): void {
  if (pref === "off") root.setAttribute("data-motion", "off");
  else root.removeAttribute("data-motion");
}
