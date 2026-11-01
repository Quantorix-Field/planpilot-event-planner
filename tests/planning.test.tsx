import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  PlanningDialog,
  SLOW_LINE,
  STAGE_LINES,
  stageLine,
} from "../src/components/PlanningDialog";

const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

describe("stageLine", () => {
  it("steps through the four lines and starts over", () => {
    expect(stageLine(0, false)).toBe("Counting back from your date…");
    expect(stageLine(1, false)).toBe("Balancing the budget to the last rupee…");
    expect(stageLine(2, false)).toBe("Finding vendors worth calling…");
    expect(stageLine(3, false)).toBe("Adding ideas only you would love…");
    expect(stageLine(4, false)).toBe(STAGE_LINES[0]);
    expect(stageLine(9, false)).toBe(STAGE_LINES[1]);
  });

  it("switches to the still-working line after 20 seconds", () => {
    expect(stageLine(0, true)).toBe(SLOW_LINE);
    expect(stageLine(3, true)).toBe("Still working. Good plans take a moment.");
  });
});

describe("PlanningDialog", () => {
  const html = renderToStaticMarkup(<PlanningDialog open={false} daysToGo={52} done={false} onStop={() => {}} />);

  it("is a named native dialog with a Stop button", () => {
    expect(html).toContain("<dialog");
    expect(html).toContain("aria-labelledby=");
    expect(html).toContain("Drafting your plan");
    expect(html).toContain(">Stop</button>");
    expect(html).not.toContain(" open");
  });

  it("hides the drawing from screen readers and announces progress in words", () => {
    expect(html).toContain('<svg viewBox="0 0 260 260" aria-hidden="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain("Building your plan. This takes about 10 to 20 seconds.");
  });

  it("draws eight diyas and sixteen petals", () => {
    expect(count(html, /class="diya"/g)).toBe(8);
    expect(count(html, /class="petal"/g)).toBe(8);
    expect(count(html, /class="petal petal-inner"/g)).toBe(8);
  });

  it("shows the countdown to the event date", () => {
    expect(html).toContain("52 days to go");
    const today = renderToStaticMarkup(<PlanningDialog open={false} daysToGo={0} done={false} onStop={() => {}} />);
    expect(today).toContain("Today is the day!");
  });

  it("starts without the success burst", () => {
    expect(html).not.toContain('class="burst"');
    expect(html).not.toContain("is-done");
  });

  it("lights every diya, bursts and disables Stop once the plan has arrived", () => {
    const done = renderToStaticMarkup(<PlanningDialog open={false} daysToGo={52} done onStop={() => {}} />);
    expect(done).toContain("planning-body is-done");
    expect(count(done, /<circle r="4"/g)).toBe(12);
    expect(done).toContain("Your plan is ready.");
    expect(done).toMatch(/<button[^>]*disabled[^>]*>Stop<\/button>/);
  });
});
