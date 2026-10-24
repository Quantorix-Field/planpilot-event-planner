import type { PlanResponse } from "../../shared/schema";
import { formatInr } from "../format";

interface BudgetPanelProps {
  items: PlanResponse["budget"];
}

export function BudgetPanel({ items }: BudgetPanelProps) {
  const sorted = [...items].sort((a, b) => b.amountInr - a.amountInr);
  const total = items.reduce((sum, item) => sum + item.amountInr, 0);
  return (
    <div>
      <h3>Budget breakdown</h3>
      <ul className="budget-list">
        {sorted.map((item, index) => (
          <li className="budget-row" key={`${index}-${item.category}`}>
            <div className="budget-head">
              <span>{item.category}</span>
              <span>{formatInr(item.amountInr)}</span>
            </div>
            <div className="bar" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${item.percent}%` }} />
            </div>
            <p className="budget-note">
              {item.percent}% · {item.note}
            </p>
          </li>
        ))}
      </ul>
      <div className="total-line">
        <span>Total</span>
        <span>{formatInr(total)}</span>
      </div>
    </div>
  );
}
