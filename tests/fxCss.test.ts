import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = join(__dirname, "..", "src");
const sheets = readdirSync(dir)
  .filter((name) => name.endsWith(".css"))
  .map((name) => ({ name, css: readFileSync(join(dir, name), "utf8") }));
const all = sheets.map((sheet) => sheet.css).join("\n");

const KEYWORDS = new Set([
  "none", "linear", "ease", "ease-in", "ease-out", "ease-in-out", "both", "forwards", "backwards",
  "infinite", "normal", "reverse", "alternate", "alternate-reverse", "running", "paused",
  "step-start", "step-end",
]);

/** Names used by `animation` and `animation-name` declarations. */
function animationNames(css: string): string[] {
  const names: string[] = [];
  for (const match of css.matchAll(/(?:^|[\s;{])animation(?:-name)?\s*:\s*([^;}]+)/g)) {
    const value = (match[1] ?? "").replace(/\w+\((?:[^()]|\([^()]*\))*\)/g, "");
    for (const token of value.split(/[\s,]+/)) {
      if (/^[a-z][a-z-]*$/.test(token) && !KEYWORDS.has(token)) names.push(token);
    }
  }
  return names;
}

describe("stylesheets", () => {
  it("define every keyframe set that an animation uses", () => {
    const defined = new Set([...all.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]));
    const missing = [...new Set(animationNames(all))].filter((name) => !defined.has(name));
    expect(missing).toEqual([]);
  });

  it("load nothing from other sites, which the strict CSP would block", () => {
    // Inline data: pictures may name the SVG namespace; that is not a network request.
    expect(all.replace(/url\("data:[^"]*"\)/g, "")).not.toMatch(/@import|https?:\/\//);
  });

  it("gate scroll-driven motion behind support, reduced motion and the pause toggle", () => {
    for (const sheet of sheets) {
      for (const match of sheet.css.matchAll(/^\s+animation-timeline\s*:/gm)) {
        const before = sheet.css.slice(0, match.index);
        expect(before.lastIndexOf("@supports")).toBeGreaterThan(-1);
        expect(before.lastIndexOf("prefers-reduced-motion: no-preference")).toBeGreaterThan(-1);
        expect(before.lastIndexOf('[data-motion="off"]')).toBeGreaterThan(-1);
      }
    }
  });
});
