import { useEffect, useRef, useState } from "react";
import { todayIst } from "../../shared/schema";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlanCard } from "../components/PlanCard";
import { clearFlash, peekFlash } from "../flash";
import { MAX_PLANS, deletePlan, listPlans, type StoredPlan } from "../planStore";
import { planTitle } from "../planSummary";
import { Link, usePageMeta } from "../router";

export default function Plans() {
  usePageMeta("My plans");
  const [plans, setPlans] = useState(() => listPlans());
  const [pending, setPending] = useState<StoredPlan | null>(null);
  const [notice, setNotice] = useState(() => peekFlash());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);
  const today = todayIst();

    // The message left by another page (for example "Plan deleted.") is shown once, then cleared.
  useEffect(() => {
    clearFlash();
  }, []);
  // After a delete the clicked button is gone, so focus goes to the page heading.
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    headingRef.current?.focus();
  }, [plans]);

  function confirmDelete() {
    if (!pending) return;
    const deleted = deletePlan(pending.id);
    setNotice(deleted ? "Plan deleted." : "That plan could not be deleted. Please try again.");
    setPending(null);
    setPlans(listPlans());
    focusHeading.current = true;
  }

  return (
    <div className="container page">
      <h1 ref={headingRef} tabIndex={-1}>
        My plans
      </h1>
      <p className="notice" role="status">
        {notice}
      </p>

      {plans.length === 0 ? (
        <section className="card empty-state" aria-labelledby="empty-title">
          <h2 id="empty-title">No plans yet</h2>
          <p>Your plans will appear here. They stay on this device.</p>
          <Link to="/plan" className="btn btn-primary">
            Plan your first celebration
          </Link>
        </section>
      ) : (
        <>
          <p className="lead">
            {plans.length} of {MAX_PLANS} plans saved on this device.
            {plans.length >= MAX_PLANS ? " Delete one to make room for a new plan." : ""}
          </p>
          <ul className="plan-list">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} today={today} onDelete={setPending} />
            ))}
          </ul>
          <div className="btn-row plans-actions">
            <Link to="/plan" className="btn btn-primary">
              Plan another celebration
            </Link>
          </div>
        </>
      )}

      <ConfirmDialog
        open={pending !== null}
        title="Delete this plan?"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onDismiss={() => setPending(null)}
      >
        {pending ? <p className="dialog-plan">{planTitle(pending.request)}</p> : null}
        <p>This can't be undone.</p>
      </ConfirmDialog>
    </div>
  );
}
