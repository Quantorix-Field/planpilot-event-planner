import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DonutChart } from "../src/components/DonutChart";
import { EXAMPLE, HOME_STEPS, INDIA_CHIPS, TRUST_POINTS } from "../src/homeContent";
import Home from "../src/pages/Home";

const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

describe("Home scenes", () => {
  const html = renderToStaticMarkup(<Home />);

  it("has one h1 and seven scenes, each named by its own heading", () => {
    expect(count(html, /<h1[\s>]/g)).toBe(1);
    expect(count(html, /<h2[\s>]/g)).toBe(6);
    const labelled = [...html.matchAll(/<section[^>]*aria-labelledby="([^"]+)"/g)];
    expect(labelled.length).toBe(7);
    for (const match of labelled) expect(html).toContain(`id="${match[1]}"`);
  });

  it("keeps the how-it-works anchor, its three steps and the call to action", () => {
    expect(html).toContain('id="how-it-works"');
    expect(count(html, /class="card step"/g)).toBe(HOME_STEPS.length);
    expect(html).toContain('href="/plan"');
    expect(html).toContain('href="/#how-it-works"');
  });

  it("labels the example plan so nobody mistakes it for real data", () => {
    expect(html).toContain("Example plan · made-up numbers");
    expect(html).toContain(EXAMPLE.title);
    expect(html).toContain("₹15,00,000");
  });

  it("links each event type to the form with that type selected", () => {
    for (const type of ["wedding", "birthday", "community"]) {
      expect(html).toContain(`href="/plan?type=${type}"`);
    }
  });

  it("shows the honesty points and the India chips", () => {
    expect(count(html, /class="trust-card"/g)).toBe(TRUST_POINTS.length);
    expect(count(html, /class="chip"/g)).toBe(INDIA_CHIPS.length);
    expect(html).toContain("Estimates, not quotes");
  });

  it("keeps all pictures decorative and sized, so nothing jumps or is read aloud", () => {
    const images = html.match(/<img[^>]*>/g) ?? [];
    expect(images.length).toBe(2);
    for (const image of images) {
      expect(image).toContain('alt=""');
      expect(image).toMatch(/width="\d+"/);
      expect(image).toMatch(/height="\d+"/);
    }
    expect(html).toContain('class="hero-art" aria-hidden="true"');
    expect(html).toContain('class="lamps" aria-hidden="true"');
  });

  it("loads nothing from other sites, which the strict CSP would block", () => {
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("<script");
  });
});

describe("DonutChart", () => {
  const items = [
    { label: "Venue", value: 450_000, valueLabel: "₹4,50,000" },
    { label: "Catering", value: 525_000, valueLabel: "₹5,25,000" },
    { label: "Decor", value: 225_000, valueLabel: "₹2,25,000" },
  ];
  const html = renderToStaticMarkup(<DonutChart title="Where it goes" centre="₹12,00,000" items={items} />);

  it("hides the picture from screen readers and keeps every number in the legend", () => {
    expect(html).toContain('<svg viewBox="0 0 42 42" aria-hidden="true"');
    for (const item of items) {
      expect(html).toContain(item.label);
      expect(html).toContain(item.valueLabel);
    }
    expect(html).toContain("38%");
    expect(html).toContain("44%");
    expect(html).toContain("19%");
  });

  it("draws one arc per slice with its own colour", () => {
    expect(count(html, /class="donut-arc tone-\d"/g)).toBe(3);
    expect(html).toContain('pathLength="100"');
    expect(html).toContain("tone-0");
    expect(html).toContain("tone-2");
  });

  it("draws no arcs when there is nothing to show", () => {
    const empty = renderToStaticMarkup(<DonutChart title="Empty" centre="" items={[]} />);
    expect(empty).not.toContain("donut-arc");
  });
});
