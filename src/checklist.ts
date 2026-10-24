export type ChecklistKind = "timeline" | "vendor";

/** Stable id for a checklist row, e.g. "timeline-0". Used for the checkbox and for saving. */
export function itemId(kind: ChecklistKind, index: number): string {
  return `${kind}-${index}`;
}

/** How many of the first `total` rows of this list are ticked. */
export function countChecked(
  kind: ChecklistKind,
  total: number,
  checked: readonly string[],
): number {
  const ticked = new Set(checked);
  let count = 0;
  for (let index = 0; index < total; index++) {
    if (ticked.has(itemId(kind, index))) count++;
  }
  return count;
}
