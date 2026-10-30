import { daysBetween } from "../../shared/finalize";
import { countdownLabel, formatDate, formatInr } from "../format";
import type { StoredPlan } from "../planStore";
import { planProgress, planTitle } from "../planSummary";
import { Link } from "../router";

function Meter({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <div className="plan-meter">
      <span>
        {label} {done} of {total}
      </span>
      <progress className="progress" value={done} max={Math.max(total, 1)} aria-label={`${label} done`} />
    </div>
  );
}

interface PlanCardProps {
  plan: StoredPlan;
  /** Today's date as YYYY-MM-DD, so the countdown can be tested. */
  today: string;
  onDelete: (plan: StoredPlan) => void;
}

/** One saved plan in the My plans list. */
export function PlanCard({ plan, today, onDelete }: PlanCardProps) {
  const { request } = plan;
  const title = planTitle(request);
  const progress = planProgress(plan);
  const headingId = `plan-${plan.id}`;

  return (
    <li>
      <article className="card plan-card" aria-labelledby={headingId}>
        <div className="plan-card-top">
          <h2 id={headingId} className="plan-card-title">
            {title}
          </h2>
          <span className="badge-days">{countdownLabel(daysBetween(today, request.eventDate))}</span>
        </div>
        <p className="plan-card-meta">
          {formatDate(request.eventDate)} · {request.guestCount} guests · {formatInr(request.budgetInr)}
        </p>
        <Meter label="Tasks" done={progress.tasksDone} total={progress.tasksTotal} />
        <Meter label="Vendors" done={progress.vendorsDone} total={progress.vendorsTotal} />
        <div className="btn-row">
          <Link to={`/plans/${plan.id}`} className="btn btn-primary btn-small" aria-label={`View ${title}`}>
            View
          </Link>
          <Link to={`/plan?edit=${plan.id}`} className="btn btn-secondary btn-small" aria-label={`Edit ${title}`}>
            Edit
          </Link>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            aria-label={`Delete ${title}`}
            onClick={() => onDelete(plan)}
          >
            Delete
          </button>
        </div>
      </article>
    </li>
  );
}
