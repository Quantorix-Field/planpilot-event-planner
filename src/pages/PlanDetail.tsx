import { useState } from "react";
import { todayIst } from "../../shared/schema";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlanStats } from "../components/PlanStats";
import { Results } from "../components/Results";
import { setFlash } from "../flash";
import { deletePlan, getPlan, updatePlan, type StoredPlan } from "../planStore";
import { planTitle } from "../planSummary";
import { Link, navigate, usePageMeta } from "../router";
import { toggleChecked } from "../storage";
import NotFound from "./NotFound";

export function PlanView({ stored, onChange }: { stored: StoredPlan; onChange: (plan: StoredPlan) => void }) {
  const title = planTitle(stored.request);
  usePageMeta(title);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState("");
  const today = todayIst();

  function handleToggle(itemId: string) {
    const checked = toggleChecked(stored.checked, itemId);
    const saved = updatePlan(stored.id, { checked });
    if (saved) {
      onChange(saved);
      setNotice("");
    } else {
      onChange({ ...stored, checked });
      setNotice("Your tick could not be saved on this device.");
    }
  }

  function handleDelete() {
    setConfirming(false);
    if (deletePlan(stored.id)) {
      setFlash("Plan deleted.");
      navigate("/plans");
    } else {
      setNotice("That plan could not be deleted. Please try again.");
    }
  }

  return (
    <div className="container page">
      <Link to="/plans" className="back-link no-print">
        <span aria-hidden="true">←</span> My plans
      </Link>
      <h1>{title}</h1>
      <PlanStats plan={stored} today={today} />
      <p className="notice" role="status">
        {notice}
      </p>

      <Results
        request={stored.request}
        plan={stored.plan}
        checked={stored.checked}
        onToggle={handleToggle}
        onEdit={() => navigate(`/plan?edit=${stored.id}`)}
      />

      <div className="btn-row plan-actions no-print">
        <button type="button" className="btn btn-secondary" onClick={() => setConfirming(true)}>
          Delete this plan
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete this plan?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onDismiss={() => setConfirming(false)}
      >
        <p className="dialog-plan">{title}</p>
        <p>This can't be undone.</p>
      </ConfirmDialog>
    </div>
  );
}

export default function PlanDetail({ id }: { id: string }) {
  const [stored, setStored] = useState(() => getPlan(id));
  if (!stored) return <NotFound kind="plan" />;
  return <PlanView stored={stored} onChange={setStored} />;
}
