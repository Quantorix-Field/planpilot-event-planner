import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlanStats, daysValue } from "../src/components/PlanStats";
import { clearFlash, peekFlash, setFlash } from "../src/flash";
import PlanDetail, { PlanView } from "../src/pages/PlanDetail";
import type { StoredPlan } from "../src/planStore";
import { makePlanResponse, makeRequest } from "./fixtures";

const stored: StoredPlan = {
  id: "3f2b8c1e-5d4a-4b7e-9c1d-2a6f8e0b4c7d",
  createdAt: "2026-10-29T10:00:00.000Z",
  updatedAt: "2026-10-29T10:00:00.000Z",
  request: makeRequest({ eventDate: "2099-12-12" }),
  plan: makePlanResponse(),
  checked: ["timeline-0", "vendor-0", "vendor-1"],
};

const h1Count = (html: string) => (html.match(/<h1[\s>]/g) ?? []).length;

describe("daysValue", () => {
  it("gives a number, or a word when the date is near or gone", () => {
    expect(daysValue(44)).toBe("44");
    expect(daysValue(2)).toBe("2");
    expect(daysValue(1)).toBe("Tomorrow");
    expect(daysValue(0)).toBe("Today");
    expect(daysValue(-3)).toBe("Passed");
  });
});

describe("PlanStats", () => {
  const html = renderToStaticMarkup(<PlanStats plan={stored} today="2099-10-29" />);

  it("shows days to go, budget, tasks done and vendors booked", () => {
    expect(html).toContain("<dt>Days to go</dt>");
    expect(html).toContain("<dd>44</dd>");
    expect(html).toContain("<dt>Budget</dt>");
    expect(html).toContain("<dd>₹15,00,000</dd>");
    expect(html).toContain("<dt>Tasks done</dt>");
    expect(html).toContain("<dd>1 of 2</dd>");
    expect(html).toContain("<dt>Vendors booked</dt>");
    expect(html).toContain("<dd>2 of 4</dd>");
  });

  it("is a description list", () => {
    expect(html.startsWith('<dl class="stats">')).toBe(true);
  });
});

describe("PlanView", () => {
  const html = renderToStaticMarkup(<PlanView stored={stored} onChange={() => {}} />);

  it("has one h1 with the plan title and a back link to My plans", () => {
    expect(h1Count(html)).toBe(1);
    expect(html).toContain("<h1>Wedding, Jaipur</h1>");
    expect(html).toContain('href="/plans"');
  });

  it("has print, edit and delete actions", () => {
    expect(html).toContain("Print / Save as PDF");
    expect(html).toContain("Edit details");
    expect(html).toContain("Delete this plan");
  });

  it("has the four plan tabs and a status area for messages", () => {
    for (const label of ["Budget", "Timeline", "Vendors", "Ideas"]) {
      expect(html).toContain(`>${label}</button>`);
    }
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="status"');
  });

  it("includes a confirm dialog that starts closed", () => {
    expect(html).toContain("<dialog");
    expect(html).toContain("Delete this plan?");
    expect(html).not.toContain(" open");
  });
});

describe("PlanDetail", () => {
  it("shows the friendly not-found page for an id that is not saved", () => {
    const html = renderToStaticMarkup(<PlanDetail id="00000000-0000-4000-8000-0000000000ff" />);
    expect(h1Count(html)).toBe(1);
    expect(html).toContain("couldn&#x27;t find that plan");
    expect(html).toContain('href="/plans"');
  });
});

describe("flash message", () => {
  it("is empty until one is set, and is cleared on request", () => {
    clearFlash();
    expect(peekFlash()).toBe("");
    setFlash("Plan deleted.");
    expect(peekFlash()).toBe("Plan deleted.");
    expect(peekFlash()).toBe("Plan deleted.");
    clearFlash();
    expect(peekFlash()).toBe("");
  });
});
