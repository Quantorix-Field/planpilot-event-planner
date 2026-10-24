import { daysBetween } from "../shared/finalize";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** 1500000 -> "₹15,00,000" */
export function formatInr(amount: number): string {
  return inr.format(amount);
}

/** "2026-12-12" -> "12 Dec 2026" */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

/** How far a due date is from today, in plain words. */
export function dueLabel(dueDate: string, today: string): string {
  const days = daysBetween(today, dueDate);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/** Event countdown text, e.g. "52 days to go". */
export function countdownLabel(days: number): string {
  if (days < 0) return "This date has passed";
  if (days === 0) return "Today is the day!";
  if (days === 1) return "Tomorrow";
  return `${days} days to go`;
}
