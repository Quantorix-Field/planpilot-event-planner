import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlanForm } from "../src/components/PlanForm";
import { makeRequest } from "./fixtures";

const noop = () => undefined;
const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

/** The opening tag of one chip, whatever order the attributes come out in. */
function inputTag(html: string, name: string, value: string): string {
  const pattern = new RegExp(`<input[^>]*name="${name}"[^>]*value="${value}"[^>]*>`);
  return pattern.exec(html)?.[0] ?? "";
}

const render = (initial: ReturnType<typeof makeRequest> | null = null) =>
  renderToStaticMarkup(<PlanForm initial={initial} busy={false} serverErrors={{}} onSubmit={noop} />);

describe("two-step form markup", () => {
  it("shows a progress list with step 1 current, and hides step 2", () => {
    const html = render();
    expect(html).toContain('aria-label="Form progress"');
    expect(count(html, /aria-current="step"/g)).toBe(1);
    expect(count(html, /class="form-grid" hidden=""/g)).toBe(1);
    expect(html).toContain("Next: style and traditions");
    expect(html).toContain("Back to basics");
  });

  it("gives each step a focusable heading", () => {
    const html = render();
    expect(count(html, /<h3 class="step-heading full" tabindex="-1"/g)).toBe(2);
    expect(html).toContain("Step 1 of 2: Basics");
    expect(html).toContain("Step 2 of 2: Style and traditions");
  });

  it("groups every set of chips in a fieldset with a legend and a hint", () => {
    const html = render(makeRequest());
    for (const legend of [
      "Traditions and functions (optional)",
      "Food preference (optional)",
      "Style and mood (optional)",
    ]) {
      expect(html).toContain(`<legend>${legend}</legend>`);
    }
    for (const id of ["traditions-hint", "food-hint", "styles-hint"]) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("offers traditions that fit the event type only", () => {
    const wedding = render(makeRequest({ eventType: "wedding" }));
    expect(wedding).toContain('value="Haldi"');
    expect(wedding).not.toContain('value="Cake cutting"');
    const birthday = render(makeRequest({ eventType: "birthday" }));
    expect(birthday).toContain('value="Cake cutting"');
    expect(birthday).not.toContain('value="Haldi"');
  });

  it("asks for an event type before offering traditions", () => {
    const html = render();
    expect(count(html, /name="traditions"/g)).toBe(0);
    expect(html).toContain("Choose an event type in step 1 to see the options.");
  });

  it("offers a no-preference food choice plus the listed ones", () => {
    const html = render();
    expect(count(html, /name="food"/g)).toBe(5);
    expect(html).toContain("No preference");
    expect(html).toContain('value="Jain"');
  });

  it("pre-selects the chips of an earlier plan", () => {
    const html = render(makeRequest({ traditions: ["Haldi"], food: "Jain", styles: ["Royal"] }));
    expect(inputTag(html, "traditions", "Haldi")).toContain('checked=""');
    expect(inputTag(html, "food", "Jain")).toContain('checked=""');
    expect(inputTag(html, "styles", "Royal")).toContain('checked=""');
    expect(inputTag(html, "styles", "Modern")).not.toContain("checked");
    expect(html).toContain("Pick up to 3. 1 chosen.");
  });

  it("wraps every chip input in a label", () => {
    const html = render(makeRequest());
    const inputs = count(html, /<input type="(?:checkbox|radio)"/g);
    expect(count(html, /<label class="choice"/g)).toBe(inputs);
  });
});
