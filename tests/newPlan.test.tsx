import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import NewPlan from "../src/pages/NewPlan";

describe("NewPlan page (new plan mode)", () => {
  const html = renderToStaticMarkup(<NewPlan />);

  it("has one h1 and the form with its default button", () => {
    expect((html.match(/<h1[\s>]/g) ?? []).length).toBe(1);
    expect(html).toContain("<h1>Plan my celebration</h1>");
    expect(html).toContain("Create my plan");
    expect(html).toContain('name="eventType"');
  });

  it("starts with no messages, no results and a closed redraft dialog", () => {
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("Your plan</h2>");
    expect(html).toContain("<dialog");
    expect(html).toContain("Redraft this plan?");
    expect(html).not.toContain(" open");
  });

  it("has a status area for progress messages", () => {
    expect(html).toContain('role="status"');
  });
});
