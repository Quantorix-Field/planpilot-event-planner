import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { addDays } from "../shared/finalize";
import { todayIst } from "../shared/schema";
import { BudgetPanel } from "../src/components/BudgetPanel";
import { IdeasPanel } from "../src/components/IdeasPanel";
import { PlanForm } from "../src/components/PlanForm";
import { Results } from "../src/components/Results";
import { TimelinePanel } from "../src/components/TimelinePanel";
import { VendorsPanel } from "../src/components/VendorsPanel";
import { makeAiPlan, makePlanResponse, makeRequest } from "./fixtures";

const noop = () => undefined;
const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

describe("PlanForm markup", () => {
  const render = (busy = false, initial = null as ReturnType<typeof makeRequest> | null) =>
    renderToStaticMarkup(<PlanForm initial={initial} busy={busy} serverErrors={{}} onSubmit={noop} />);

  it("labels every field and groups the event types", () => {
    const html = render();
    for (const id of ["eventDate", "guestCount", "budgetInr", "city", "vibe"]) {
      expect(html).toContain(`for="${id}"`);
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain("<legend>Event type</legend>");
    expect(count(html, /type="radio"/g)).toBe(3);
    expect(html).toContain("Community event");
  });

  it("links hints to their fields and turns off browser validation bubbles", () => {
    const html = render();
    expect(html).toContain('aria-describedby="budgetInr-hint"');
    expect(html.toLowerCase()).toContain("novalidate");
  });

  it("disables the button while a plan is being built", () => {
    expect(render(false)).toContain("Create my plan");
    const busy = render(true);
    expect(busy).toContain("Planning…");
    expect(busy).toContain("disabled");
  });

  it("pre-fills the form from an earlier plan", () => {
    const html = render(false, makeRequest({ guestCount: 150, city: "Jaipur" }));
    expect(html).toContain('value="150"');
    expect(html).toContain('value="Jaipur"');
    expect(html).toContain("checked");
  });
});

describe("Results markup", () => {
  const eventDate = addDays(todayIst(), 10);
  const html = renderToStaticMarkup(
    <Results
      request={makeRequest({ eventDate })}
      plan={makePlanResponse()}
      checked={[]}
      onToggle={noop}
      onEdit={noop}
    />,
  );

  it("shows the event summary and countdown", () => {
    expect(html).toContain("Your plan");
    expect(html).toContain("10 days to go");
    expect(html).toContain("150 guests");
    expect(html).toContain("Jaipur");
  });

  it("follows the ARIA tabs pattern", () => {
    expect(html).toContain('role="tablist"');
    expect(count(html, /role="tab"/g)).toBe(4);
    expect(count(html, /aria-selected="true"/g)).toBe(1);
    expect(count(html, /aria-selected="false"/g)).toBe(3);
    expect(count(html, /role="tabpanel"/g)).toBe(4);
    expect(html).toContain('aria-labelledby="tab-timeline"');
    expect(html).toContain('aria-controls="panel-vendors"');
  });

  it("shows only the active panel on screen", () => {
    expect(count(html, /hidden=""/g)).toBe(3);
  });

  it("keeps only the selected tab in the tab order", () => {
    expect(count(html, /class="tab"[^>]*tabindex="0"/g)).toBe(1);
    expect(count(html, /class="tab"[^>]*tabindex="-1"/g)).toBe(3);
  });

  it("hides the controls when printing", () => {
    expect(count(html, /no-print/g)).toBe(2);
  });
});

describe("TimelinePanel markup", () => {
  const items = makePlanResponse().timeline;

  it("renders a checkbox per task with a matching label", () => {
    const html = renderToStaticMarkup(
      <TimelinePanel items={items} checked={[]} onToggle={noop} today="2099-09-01" />,
    );
    expect(count(html, /type="checkbox"/g)).toBe(2);
    expect(html).toContain('for="chk-timeline-0"');
    expect(html).toContain('id="chk-timeline-1"');
    expect(html).toContain("Book the venue");
    expect(html).toContain("1 Oct 2099");
  });

  it("reflects ticked items in the progress and styling", () => {
    const html = renderToStaticMarkup(
      <TimelinePanel items={items} checked={["timeline-1"]} onToggle={noop} today="2099-09-01" />,
    );
    expect(html).toContain("1 of 2 tasks done");
    expect(html).toContain('value="1"');
    expect(html).toContain('max="2"');
    expect(count(html, /check-item done/g)).toBe(1);
    expect(html).toContain('aria-live="polite"');
  });
});

describe("VendorsPanel markup", () => {
  it("shows priority badges, estimates and ticks", () => {
    const vendors = makeAiPlan().vendors;
    const html = renderToStaticMarkup(
      <VendorsPanel items={vendors} checked={["vendor-0", "vendor-2"]} onToggle={noop} />,
    );
    expect(count(html, /type="checkbox"/g)).toBe(4);
    expect(html).toContain("2 of 4 vendors done");
    expect(html).toContain("badge-must-book");
    expect(html).toContain("badge-recommended");
    expect(html).toContain("badge-optional");
    expect(html).toContain("Estimate ₹4,50,000");
  });
});

describe("BudgetPanel markup", () => {
  it("lists the biggest spend first, with bars and an exact total", () => {
    const html = renderToStaticMarkup(<BudgetPanel items={makePlanResponse().budget} />);
    expect(html.indexOf("Venue")).toBeLessThan(html.indexOf("Catering"));
    expect(html).toContain("₹9,00,000");
    expect(html).toContain("₹15,00,000");
    expect(html).toContain("width:60%");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("IdeasPanel markup", () => {
  it("renders each idea as a headed card", () => {
    const html = renderToStaticMarkup(<IdeasPanel items={makeAiPlan().ideas} />);
    expect(count(html, /<h4>/g)).toBe(3);
    expect(html).toContain("Haldi on the lawn");
  });
});
