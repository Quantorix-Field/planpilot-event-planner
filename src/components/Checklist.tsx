import type { ReactNode } from "react";

interface CheckItemProps {
  id: string;
  checked: boolean;
  onToggle: (id: string) => void;
  title: string;
  children?: ReactNode;
}

export function CheckItem({ id, checked, onToggle, title, children }: CheckItemProps) {
  const inputId = `chk-${id}`;
  return (
    <li className={checked ? "check-item done" : "check-item"}>
      <input
        type="checkbox"
        id={inputId}
        checked={checked}
        onChange={() => onToggle(id)}
      />
      <label className="check-label" htmlFor={inputId}>
        <span className="check-title">{title}</span>
        {children ? <span className="check-meta">{children}</span> : null}
      </label>
    </li>
  );
}

interface ChecklistProgressProps {
  done: number;
  total: number;
  noun: string;
}

export function ChecklistProgress({ done, total, noun }: ChecklistProgressProps) {
  return (
    <>
      <progress className="progress" value={done} max={total} aria-label={`${noun} completed`} />
      <p className="panel-intro" aria-live="polite">
        {done} of {total} {noun} done
      </p>
    </>
  );
}
