export const TAB_IDS = ["budget", "timeline", "vendors", "ideas"] as const;
export type TabId = (typeof TAB_IDS)[number];

export const TAB_LABELS: Record<TabId, string> = {
  budget: "Budget",
  timeline: "Timeline",
  vendors: "Vendors",
  ideas: "Ideas",
};

/**
 * Which tab a key press should move to (ARIA tabs pattern), or null if the key
 * isn't a tab-navigation key. Left/Right wrap around; Home/End jump to the ends.
 */
export function nextTabIndex(current: number, key: string, count: number): number | null {
  switch (key) {
    case "ArrowRight":
      return (current + 1) % count;
    case "ArrowLeft":
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
