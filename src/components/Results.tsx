import { useRef, useState, type KeyboardEvent } from "react";
import { daysBetween } from "../../shared/finalize";
import {
  EVENT_TYPE_LABELS,
  todayIst,
  type PlanRequest,
  type PlanResponse,
} from "../../shared/schema";
import { countdownLabel, formatDate } from "../format";
import { TAB_IDS, TAB_LABELS, nextTabIndex, type TabId } from "../tabs";
import { BudgetPanel } from "./BudgetPanel";
import { IdeasPanel } from "./IdeasPanel";
import { TimelinePanel } from "./TimelinePanel";
import { VendorsPanel } from "./VendorsPanel";

interface ResultsProps {
  request: PlanRequest;
  plan: PlanResponse;
  checked: string[];
  onToggle: (id: string) => void;
  onEdit: () => void;
}

export function Results({ request, plan, checked, onToggle, onEdit }: ResultsProps) {
  const [active, setActive] = useState<TabId>("budget");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const today = todayIst();
  const daysLeft = daysBetween(today, request.eventDate);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = nextTabIndex(index, event.key, TAB_IDS.length);
    if (next === null) return;
    event.preventDefault();
    const id = TAB_IDS[next];
    if (!id) return;
    setActive(id);
    tabRefs.current[next]?.focus();
  }

  return (
    <section className="card" id="results" aria-labelledby="results-heading">
      <div className="results-top">
        <h2 id="results-heading" tabIndex={-1}>
          Your plan
        </h2>
        <p className="panel-intro">
          {EVENT_TYPE_LABELS[request.eventType]} · {formatDate(request.eventDate)} ·{" "}
          {request.guestCount} guests · {request.city}
        </p>
        <span className="badge-days">{countdownLabel(daysLeft)}</span>
        <p>{plan.summary}</p>
        <div className="btn-row no-print">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
          <button type="button" className="btn btn-secondary" onClick={onEdit}>
            Edit details
          </button>
        </div>
      </div>

      <div className="tabs no-print" role="tablist" aria-label="Plan sections">
        {TAB_IDS.map((id, index) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            className="tab"
            aria-selected={active === id}
            aria-controls={`panel-${id}`}
            tabIndex={active === id ? 0 : -1}
            onClick={() => setActive(id)}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => handleKeyDown(event, index)}
            ref={(element: HTMLButtonElement | null) => {
              tabRefs.current[index] = element;
            }}
          >
            {TAB_LABELS[id]}
          </button>
        ))}
      </div>

      <div
        className="tabpanel"
        role="tabpanel"
        id="panel-budget"
        aria-labelledby="tab-budget"
        tabIndex={0}
        hidden={active !== "budget"}
      >
        <BudgetPanel items={plan.budget} />
      </div>
      <div
        className="tabpanel"
        role="tabpanel"
        id="panel-timeline"
        aria-labelledby="tab-timeline"
        tabIndex={0}
        hidden={active !== "timeline"}
      >
        <TimelinePanel items={plan.timeline} checked={checked} onToggle={onToggle} today={today} />
      </div>
      <div
        className="tabpanel"
        role="tabpanel"
        id="panel-vendors"
        aria-labelledby="tab-vendors"
        tabIndex={0}
        hidden={active !== "vendors"}
      >
        <VendorsPanel items={plan.vendors} checked={checked} onToggle={onToggle} />
      </div>
      <div
        className="tabpanel"
        role="tabpanel"
        id="panel-ideas"
        aria-labelledby="tab-ideas"
        tabIndex={0}
        hidden={active !== "ideas"}
      >
        <IdeasPanel items={plan.ideas} />
      </div>
    </section>
  );
}
