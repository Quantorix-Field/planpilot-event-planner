import { daysBetween } from "../../shared/finalize";
import { formatInr } from "../format";
import type { StoredPlan } from "../planStore";
import { planProgress } from "../planSummary";

/** The days-to-go figure: a number, or a word when the date is near or gone. */
export function daysValue(days: number): string {
  if (days > 1) return String(days);
  if (days === 1) return "Tomorrow";
  if (days === 0) return "Today";
  return "Passed";
}

interface PlanStatsProps {
  plan: Pick<StoredPlan, "request" | "plan" | "checked">;
  /** Today's date as YYYY-MM-DD. */
  today: string;
}

/** Four numbers at the top of a plan: days to go, budget, tasks done, vendors booked. */
export function PlanStats({ plan, today }: PlanStatsProps) {
  const progress = planProgress(plan);
  const stats = [
    { label: "Days to go", value: daysValue(daysBetween(today, plan.request.eventDate)) },
    { label: "Budget", value: formatInr(plan.request.budgetInr) },
    { label: "Tasks done", value: `${progress.tasksDone} of ${progress.tasksTotal}` },
    { label: "Vendors booked", value: `${progress.vendorsDone} of ${progress.vendorsTotal}` },
  ];

  return (
    <dl className="stats">
      {stats.map((stat) => (
        <div key={stat.label} className="stat">
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
