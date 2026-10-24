import type { PlanResponse } from "../../shared/schema";
import { countChecked, itemId } from "../checklist";
import { formatInr } from "../format";
import { CheckItem, ChecklistProgress } from "./Checklist";

type Priority = PlanResponse["vendors"][number]["priority"];

const PRIORITY_LABELS: Record<Priority, string> = {
  "must-book": "Must book",
  recommended: "Recommended",
  optional: "Optional",
};

interface VendorsPanelProps {
  items: PlanResponse["vendors"];
  checked: string[];
  onToggle: (id: string) => void;
}

export function VendorsPanel({ items, checked, onToggle }: VendorsPanelProps) {
  const done = countChecked("vendor", items.length, checked);
  return (
    <div>
      <h3>Vendor checklist</h3>
      <ChecklistProgress done={done} total={items.length} noun="vendors" />
      <ul className="checklist">
        {items.map((vendor, index) => {
          const id = itemId("vendor", index);
          return (
            <CheckItem
              key={id}
              id={id}
              checked={checked.includes(id)}
              onToggle={onToggle}
              title={vendor.name}
            >
              <span className={`badge badge-${vendor.priority}`}>
                {PRIORITY_LABELS[vendor.priority]}
              </span>
              <span>Estimate {formatInr(vendor.estimatedCostInr)}</span>
              <span>{vendor.tip}</span>
            </CheckItem>
          );
        })}
      </ul>
    </div>
  );
}
