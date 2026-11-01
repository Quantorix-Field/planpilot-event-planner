import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Garland } from "../src/components/Garland";
import { Mandala } from "../src/components/Mandala";
import Home from "../src/pages/Home";

const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

describe("Garland", () => {
  const html = renderToStaticMarkup(<Garland />);

  it("is decoration, hidden from screen readers", () => {
    expect(html.startsWith('<div class="garland" aria-hidden="true">')).toBe(true);
    expect(html).not.toMatch(/<(title|desc|text)[\s>]/);
  });

  it("hangs nine swags, each with a full row of marigolds", () => {
    expect(count(html, /class="garland-swag"/g)).toBe(9);
    expect(count(html, /href="#pp-marigold-\d"/g)).toBeGreaterThanOrEqual(9 * 9);
  });

  it("only points at shapes it defines", () => {
    const targets = [...html.matchAll(/(?:href="|url\(\s*)#([\w-]+)/g)].map((match) => match[1]);
    expect(targets.length).toBeGreaterThan(0);
    for (const id of targets) expect(html).toContain(`id="${id}"`);
  });

  it("loads nothing from other sites, which the strict CSP would block", () => {
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/<(script|image|img|foreignObject)[\s>]/);
  });
});

describe("Mandala", () => {
  it("is decoration and takes extra classes", () => {
    const html = renderToStaticMarkup(<Mandala className="hero-mandala" />);
    expect(html).toContain('class="mandala hero-mandala"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toMatch(/https?:\/\//);
  });
});

describe("Home headline", () => {
  it("splits into animated words but still reads as one sentence", () => {
    const html = renderToStaticMarkup(<Home />);
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? "";
    expect(count(h1, /class="word/g)).toBe(6);
    expect(h1.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()).toBe("Every celebration begins with a spark.");
  });

  it("keeps every decorative layer hidden from assistive tech", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('class="finale-embers" aria-hidden="true"');
    expect(html).toContain('class="garland" aria-hidden="true"');
    expect(html).toContain('class="mandala hero-mandala"');
  });
});
