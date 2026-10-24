import type { PlanResponse } from "../../shared/schema";

interface IdeasPanelProps {
  items: PlanResponse["ideas"];
}

export function IdeasPanel({ items }: IdeasPanelProps) {
  return (
    <div>
      <h3>Ideas for you</h3>
      <ul className="idea-grid">
        {items.map((idea, index) => (
          <li className="idea" key={`${index}-${idea.title}`}>
            <h4>{idea.title}</h4>
            <p>{idea.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
