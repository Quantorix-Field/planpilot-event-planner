import { useState } from "react";
import { ApiError, requestPlan } from "../api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlanForm } from "../components/PlanForm";
import { Results } from "../components/Results";
import { serverErrorsToForm, type FormErrors } from "../formUtils";
import { parsePlanQuery } from "../planQuery";
import { MAX_PLANS, createPlan, getPlan, listPlans, updatePlan } from "../planStore";
import { planTitle } from "../planSummary";
import { Link, navigate, useLocation, usePageMeta } from "../router";
import { toggleChecked } from "../storage";
import type { PlanRequest, PlanResponse } from "../../shared/schema";

interface Draft {
  request: PlanRequest;
  plan: PlanResponse;
}

const FULL_MESSAGE = `You already have ${MAX_PLANS} saved plans. Delete one in My plans to make room for a new one.`;

export default function NewPlan() {
  const { search } = useLocation();
  const [query] = useState(() => parsePlanQuery(search));
  const [editing] = useState(() => (query.edit ? getPlan(query.edit) : null));
  usePageMeta(editing ? "Edit plan" : "Plan my celebration");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [serverErrors, setServerErrors] = useState<FormErrors>({});
  const [pendingRequest, setPendingRequest] = useState<PlanRequest | null>(null);
  const [unsaved, setUnsaved] = useState<Draft | null>(null);
  const [unsavedChecked, setUnsavedChecked] = useState<string[]>([]);

  const missingEdit = query.edit !== undefined && editing === null;
  const alertText = full ? FULL_MESSAGE : error;

  /** Saves the drafted plan and opens it. If saving is not possible, shows the plan on this page. */
  function save(draft: Draft) {
    if (editing) {
      const updated = updatePlan(editing.id, { request: draft.request, plan: draft.plan, checked: [] });
      if (updated) {
        navigate(`/plans/${updated.id}`);
        return;
      }
    } else {
      const created = createPlan(draft);
      if (created.ok) {
        navigate(`/plans/${created.plan.id}`);
        return;
      }
      if (created.reason === "full") setFull(true);
    }
    setUnsavedChecked([]);
    setUnsaved(draft);
  }

  async function generate(request: PlanRequest) {
    setBusy(true);
    setError(null);
    setFull(false);
    setUnsaved(null);
    setServerErrors({});
    try {
      const plan = await requestPlan(request);
      save({ request, plan });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setServerErrors(serverErrorsToForm(caught.fieldErrors));
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(request: PlanRequest) {
    if (!editing && listPlans().length >= MAX_PLANS) {
      setError(null);
      setFull(true);
      return;
    }
    if (editing && editing.checked.length > 0) {
      setPendingRequest(request);
      return;
    }
    void generate(request);
  }

  function confirmRedraft() {
    const request = pendingRequest;
    setPendingRequest(null);
    if (request) void generate(request);
  }

  function handleEditDetails() {
    const field = document.getElementById("eventDate");
    field?.scrollIntoView({ block: "center" });
    field?.focus();
  }

  return (
    <div className="container page">
      <h1>{editing ? "Edit your plan" : "Plan my celebration"}</h1>
      <p className="lead">
        {editing
          ? `Change anything below and we will redraft ${planTitle(editing.request)}. The old plan is replaced.`
          : "Tell us about your event. We will draft the plan."}
      </p>
      {missingEdit ? (
        <p className="notice" role="status">
          We could not find the plan you wanted to edit. You can plan a new one below.
        </p>
      ) : null}

      <section className="card no-print" aria-labelledby="form-title">
        <h2 id="form-title">Tell us about your event</h2>
        <p className="panel-intro">
          One form in, a full plan out: budget, timeline, vendors and ideas.
        </p>
        <PlanForm
          initial={editing?.request ?? null}
          initialType={query.type}
          submitLabel={editing ? "Redraft my plan" : undefined}
          busy={busy}
          serverErrors={serverErrors}
          onSubmit={handleSubmit}
        />
      </section>

      <div className="status no-print" role="status" aria-live="polite">
        {busy ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Building your plan. This takes about 10 to 20 seconds.
          </>
        ) : null}
      </div>

      {alertText ? (
        <div className="alert no-print" role="alert">
          {alertText}
          {full ? (
            <>
              {" "}
              <Link to="/plans">Go to My plans</Link>
            </>
          ) : null}
        </div>
      ) : null}

      {unsaved ? (
        <>
          <div className="alert no-print" role="alert">
            We could not save this plan on this device, so it will be lost when you leave this page. Use
            Print / Save as PDF to keep a copy.
          </div>
          <Results
            request={unsaved.request}
            plan={unsaved.plan}
            checked={unsavedChecked}
            onToggle={(id) => setUnsavedChecked((previous) => toggleChecked(previous, id))}
            onEdit={handleEditDetails}
          />
        </>
      ) : null}

      <ConfirmDialog
        open={pendingRequest !== null}
        title="Redraft this plan?"
        confirmLabel="Redraft plan"
        onConfirm={confirmRedraft}
        onDismiss={() => setPendingRequest(null)}
      >
        <p>Your ticks on this plan will be cleared, and the old plan is replaced.</p>
      </ConfirmDialog>
    </div>
  );
}
