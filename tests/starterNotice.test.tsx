import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { planResponseSchema } from "../shared/schema";
import { Results } from "../src/components/Results";
import { makePlanResponse, makeRequest } from "./fixtures";

const noop = () => undefined;

function render(plan = makePlanResponse()): string {
  return renderToStaticMarkup(
    <Results
      request={makeRequest({ eventDate: "2099-12-12" })}
      plan={plan}
      checked={[]}
      onToggle={noop}
      onEdit={noop}
    />,
  );
}

describe("Starter plan notice", () => {
  it("shows a labelled note when the plan came from the starter", () => {
    const html = render(makePlanResponse({ source: "starter" }));
    expect(html).toContain('class="starter-note"');
    expect(html).toContain('role="note"');
    expect(html).toContain("Starter plan");
    expect(html).toContain("Edit details");
  });

  it("shows nothing for an AI plan", () => {
    const html = render();
    expect(html).not.toContain("starter-note");
    expect(html).not.toContain("Starter plan");
  });
});

describe("planResponseSchema source field", () => {
  it("keeps source: starter and treats it as optional", () => {
    const base = makePlanResponse();
    expect(planResponseSchema.parse({ ...base, source: "starter" }).source).toBe("starter");
    expect(planResponseSchema.parse(base).source).toBeUndefined();
  });

  it("rejects any other source value", () => {
    const result = planResponseSchema.safeParse({ ...makePlanResponse(), source: "ai" });
    expect(result.success).toBe(false);
  });
});
