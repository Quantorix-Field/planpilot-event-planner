import { describe, expect, it } from "vitest";
import { motionAllowed } from "../src/motion";

const root = (attribute: string | null) => ({ getAttribute: () => attribute });
const media = (matches: boolean) => () => ({ matches });

describe("motionAllowed", () => {
  it("allows motion by default", () => {
    expect(motionAllowed(root(null), media(false))).toBe(true);
  });

  it("stops when the visitor paused animations", () => {
    expect(motionAllowed(root("off"), media(false))).toBe(false);
  });

  it("stops when the device asks for reduced motion", () => {
    expect(motionAllowed(root(null), media(true))).toBe(false);
  });

  it("asks the right media query", () => {
    let asked = "";
    motionAllowed(root(null), (query) => {
      asked = query;
      return { matches: false };
    });
    expect(asked).toBe("(prefers-reduced-motion: reduce)");
  });
});
