import type { PlanResponse } from "../../shared/schema";
import { countChecked, itemId } from "../checklist";
import { dueLabel, formatDate } from "../format";
import { CheckItem, ChecklistProgress } from "./Checklist";

interface TimelinePanelProps {
  items: PlanResponse["timeline"];
  checked: string[];
  onToggle: (id: string) => void;
  today: string;
}

export function TimelinePanel({ items, checked, onToggle, today }: TimelinePanelProps) {
  const done = countChecked("timeline", items.length, checked);
  return (
    <div>
      <h3>Timeline</h3>
      <ChecklistProgress done={done} total={items.length} noun="tasks" />
      <ul className="checklist">
        {items.map((item, index) => {
          const id = itemId("timeline", index);
          return (
            <CheckItem
              key={id}
              id={id}
              checked={checked.includes(id)}
              onToggle={onToggle}
              title={item.task}
            >
              <span className="due">{dueLabel(item.dueDate, today)}</span>
              <span>{formatDate(item.dueDate)}</span>
            </CheckItem>
          );
        })}
      </ul>
    </div>
  );
}
