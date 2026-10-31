export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Browser storage if it is available (it can be blocked in private modes). */
export function getStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Returns a new list with `id` added, or removed if it was already there. */
export function toggleChecked(checked: string[], id: string): string[] {
  return checked.includes(id) ? checked.filter((c) => c !== id) : [...checked, id];
}
