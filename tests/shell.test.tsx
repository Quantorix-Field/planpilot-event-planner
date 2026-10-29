import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { Shell } from "../src/components/Shell";
import Home from "../src/pages/Home";
import NewPlan from "../src/pages/NewPlan";
import NotFound from "../src/pages/NotFound";
import Plans from "../src/pages/Plans";

const countH1 = (html: string) => (html.match(/<h1[\s>]/g) ?? []).length;

describe("Shell", () => {
  const html = renderToStaticMarkup(
    <Shell>
      <p>Page content</p>
    </Shell>,
  );

  it("has a skip link that targets the main landmark", () => {
    expect(html).toContain('href="#main"');
    expect(html).toContain("Skip to main content");
    expect(html).toContain('<main id="main" tabindex="-1">');
  });

  it("has labelled header and footer navigation with all four links", () => {
    expect(html).toContain('aria-label="Main"');
    expect(html).toContain('aria-label="Footer"');
    for (const href of ['href="/"', 'href="/plans"', 'href="/plan"', 'href="/#how-it-works"']) {
      expect(html).toContain(href);
    }
    expect(html).toContain("Plan my celebration");
  });

  it("marks the current page in the header and keeps the logo decorative", () => {
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('alt=""');
  });

  it("offers a pause-animations button in the footer", () => {
    expect(html).toContain("Pause animations");
    expect(html).toContain('type="button"');
  });

  it("shows the honesty note and leaves the h1 to each page", () => {
    expect(html).toContain("estimates, not quotes");
    expect(countH1(html)).toBe(0);
  });
});

describe("pages", () => {
  it("each page has exactly one h1", () => {
    expect(countH1(renderToStaticMarkup(<Home />))).toBe(1);
    expect(countH1(renderToStaticMarkup(<NewPlan />))).toBe(1);
    expect(countH1(renderToStaticMarkup(<Plans />))).toBe(1);
    expect(countH1(renderToStaticMarkup(<NotFound kind="page" />))).toBe(1);
    expect(countH1(renderToStaticMarkup(<NotFound kind="plan" />))).toBe(1);
  });

  it("home has the how-it-works section with three steps and a call to action", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('id="how-it-works"');
    expect((html.match(/class="card step"/g) ?? []).length).toBe(3);
    expect(html).toContain('href="/plan"');
  });

  it("the new plan page has the form", () => {
    const html = renderToStaticMarkup(<NewPlan />);
    expect(html).toContain("Plan my celebration");
    expect(html).toContain("Create my plan");
  });

  it("my plans shows a friendly empty state that links to the form", () => {
    const html = renderToStaticMarkup(<Plans />);
    expect(html).toContain("No plans yet");
    expect(html).toContain('href="/plan"');
  });

  it("not found pages explain what happened and offer a way out", () => {
    const page = renderToStaticMarkup(<NotFound kind="page" />);
    expect(page).toContain("This page is not here");
    expect(page).toContain('href="/"');
    const plan = renderToStaticMarkup(<NotFound kind="plan" />);
    expect(plan).toContain("couldn&#x27;t find that plan");
    expect(plan).toContain('href="/plans"');
  });
});

describe("ErrorBoundary", () => {
  it("renders its children when nothing is wrong", () => {
    const html = renderToStaticMarkup(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    );
    expect(html).toBe("<p>All good</p>");
  });

  it("switches to the failed state after an error", () => {
    expect(ErrorBoundary.getDerivedStateFromError()).toEqual({ failed: true });
  });
});
