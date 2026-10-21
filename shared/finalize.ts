import {
  planResponseSchema,
  todayIst,
  type AiPlan,
  type PlanRequest,
  type PlanResponse,
} from "./schema.js";

const MS_PER_DAY = 86_400_000;

function toUtcMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `fromIso` to `toIso` (both YYYY-MM-DD). Negative if `toIso` is earlier. */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtcMs(toIso) - toUtcMs(fromIso)) / MS_PER_DAY);
}

/** Shift a YYYY-MM-DD date by a number of days (negative goes back). */
export function addDays(iso: string, days: number): string {
  return new Date(toUtcMs(iso) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Turn the AI's percentages into rupee amounts that add up to exactly `totalInr`.
 * Percentages are rescaled first, so the AI never needs to make them sum to 100.
 */
export function normalizeBudget(
  items: AiPlan["budget"],
  totalInr: number,
): PlanResponse["budget"] {
  const sum = items.reduce((acc, item) => acc + item.percent, 0);
  if (sum <= 0) {
    throw new Error("Budget percentages must add up to more than zero.");
  }

  const raw = items.map((item) => (item.percent / sum) * totalInr);
  const amounts = raw.map((value) => Math.floor(value));
  const leftover = Math.max(0, totalInr - amounts.reduce((a, b) => a + b, 0));

  // Largest-remainder method: hand the leftover rupees to the biggest fractions.
  const byFraction = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let i = 0; i < leftover && i < byFraction.length; i++) {
    const entry = byFraction[i];
    if (entry) amounts[entry.index] = (amounts[entry.index] ?? 0) + 1;
  }

  return items.map((item, index) => {
    const amountInr = amounts[index] ?? 0;
    return {
      category: item.category,
      note: item.note,
      amountInr,
      percent: Math.round((amountInr / totalInr) * 1000) / 10,
    };
  });
}

/**
 * Convert "days before the event" into real dates, sorted soonest first.
 * Tasks that would already be overdue are moved to today instead of dropped.
 */
export function buildTimeline(
  items: AiPlan["timeline"],
  eventDate: string,
  today: string,
): PlanResponse["timeline"] {
  const daysUntil = daysBetween(today, eventDate);
  return items
    .map((item) => {
      const daysBefore = Math.min(item.daysBefore, daysUntil);
      return {
        dueDate: addDays(eventDate, -daysBefore),
        daysBefore,
        task: item.task,
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

const PRIORITY_RANK = { "must-book": 0, recommended: 1, optional: 2 } as const;

/** Must-book vendors first; otherwise keep the AI's order. */
export function sortVendors(vendors: AiPlan["vendors"]): AiPlan["vendors"] {
  return [...vendors].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );
}

/** Combine the user's input with the AI's plan into the final, validated response. */
export function finalizePlan(
  ai: AiPlan,
  request: PlanRequest,
  today: string = todayIst(),
): PlanResponse {
  const daysUntilEvent = daysBetween(today, request.eventDate);
  if (daysUntilEvent < 0) {
    throw new Error("The event date is in the past.");
  }
  return planResponseSchema.parse({
    summary: ai.summary,
    daysUntilEvent,
    budget: normalizeBudget(ai.budget, request.budgetInr),
    timeline: buildTimeline(ai.timeline, request.eventDate, today),
    vendors: sortVendors(ai.vendors),
    ideas: ai.ideas,
  });
}
