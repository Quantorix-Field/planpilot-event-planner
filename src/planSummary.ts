import { EVENT_TYPE_LABELS } from "../shared/schema";
import { countChecked } from "./checklist";
import type { StoredPlan } from "./planStore";

/** "Wedding, Jaipur" */
export function planTitle(request: StoredPlan["request"]): string {
  return `${EVENT_TYPE_LABELS[request.eventType]}, ${request.city}`;
}

export interface PlanProgress {
  tasksDone: number;
  tasksTotal: number;
  vendorsDone: number;
  vendorsTotal: number;
}

/** How many timeline tasks and vendors are ticked off. */
export function planProgress(plan: Pick<StoredPlan, "plan" | "checked">): PlanProgress {
  const tasksTotal = plan.plan.timeline.length;
  const vendorsTotal = plan.plan.vendors.length;
  return {
    tasksDone: countChecked("timeline", tasksTotal, plan.checked),
    tasksTotal,
    vendorsDone: countChecked("vendor", vendorsTotal, plan.checked),
    vendorsTotal,
  };
}
