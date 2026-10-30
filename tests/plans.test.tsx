import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConfirmDialog } from "../src/components/ConfirmDialog";
import { PlanCard } from "../src/components/PlanCard";
import type { StoredPlan } from "../src/planStore";
import Plans from "../src/pages/Plans";
import { makePlanResponse, makeRequest } from "./fixtures";

const plan: StoredPlan = {
  id: "3f2b8c1e-5d4a-4b7e-9c1d-2a6f8e0b4c7d",
  createdAt: "2026-10-29T10:00:00.000Z",
  updatedAt: "2026-10-29T10:00:00.000Z",
  request: makeRequest({ eventDate: "2026-12-12" }),
  plan: makePlanResponse(),
  checked: ["timeline-0", "vendor-0", "vendor-1"],
};

describe("PlanCard", () => {
  const html = renderToStaticMarkup(<PlanCard plan={plan} today="2026-10-29" onDelete={() => {}} />);

  it("shows the title, date, guests, budget and countdown", () => {
    expect(html).toContain("Wedding, Jaipur");
    expect(html).toContain("12 Dec 2026");
    expect(html).toContain("150 guests");
    expect(html).toContain("₹15,00,000");
    expect(html).toContain("44 days to go");
  });

  it("shows task and vendor progress", () => {
    expect(html).toContain("Tasks 1 of 2");
    expect(html).toContain("Vendors 2 of 4");
    expect(html).toContain('aria-label="Tasks done"');
  });

  it("links to view and edit, and has a delete button, each with a full name", () => {
    expect(html).toContain(`href="/plans/${plan.id}"`);
    expect(html).toContain(`href="/plan?edit=${plan.id}"`);
    expect(html).toContain('aria-label="View Wedding, Jaipur"');
    expect(html).toContain('aria-label="Edit Wedding, Jaipur"');
    expect(html).toContain('aria-label="Delete Wedding, Jaipur"');
  });

  it("says when the date has passed", () => {
    const past = renderToStaticMarkup(<PlanCard plan={plan} today="2027-01-01" onDelete={() => {}} />);
    expect(past).toContain("This date has passed");
  });
});

describe("ConfirmDialog", () => {
  const html = renderToStaticMarkup(
    <ConfirmDialog open={false} title="Delete this plan?" confirmLabel="Delete" onConfirm={() => {}} onDismiss={() => {}}>
      <p>This can't be undone.</p>
    </ConfirmDialog>,
  );

  it("is a named native dialog with a cancel and a confirm button", () => {
    expect(html).toContain("<dialog");
    expect(html).toContain("aria-labelledby=");
    expect(html).toContain("Delete this plan?");
    expect(html).toContain(">Cancel<");
    expect(html).toContain(">Delete<");
  });

  it("is closed until it is opened", () => {
    expect(html).not.toContain(" open");
  });
});

describe("Plans page", () => {
  it("shows the friendly empty state when nothing is saved", () => {
    const html = renderToStaticMarkup(<Plans />);
    expect(html).toContain("No plans yet");
    expect(html).toContain("Plan your first celebration");
    expect(html).toContain('role="status"');
  });
});
