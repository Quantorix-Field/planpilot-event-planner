import { describe, expect, it } from "vitest";
import {
  BIRTHDAY_TRADITIONS,
  COMMUNITY_TRADITIONS,
  FOOD_PREFERENCES,
  MAX_STYLES,
  STYLES,
  TRADITIONS,
  WEDDING_TRADITIONS,
  pickAllowed,
  toggleChoice,
  traditionsFor,
} from "../shared/formOptions";

describe("traditionsFor", () => {
  it("gives each event type its own list, and nothing before a type is chosen", () => {
    expect(traditionsFor("wedding")).toBe(WEDDING_TRADITIONS);
    expect(traditionsFor("birthday")).toBe(BIRTHDAY_TRADITIONS);
    expect(traditionsFor("community")).toBe(COMMUNITY_TRADITIONS);
    expect(traditionsFor("")).toEqual([]);
  });

  it("lists every option once, and every option is accepted by the request schema list", () => {
    for (const list of [WEDDING_TRADITIONS, BIRTHDAY_TRADITIONS, COMMUNITY_TRADITIONS]) {
      expect(new Set(list).size).toBe(list.length);
      for (const option of list) expect(TRADITIONS).toContain(option);
    }
    expect(new Set(STYLES).size).toBe(STYLES.length);
    expect(new Set(FOOD_PREFERENCES).size).toBe(FOOD_PREFERENCES.length);
  });
});

describe("pickAllowed", () => {
  it("keeps allowed values once each, in their original order", () => {
    expect(pickAllowed(["b", "a", "b", "z"], ["a", "b", "c"])).toEqual(["b", "a"]);
  });

  it("returns nothing when nothing is allowed", () => {
    expect(pickAllowed(["a"], [])).toEqual([]);
  });
});

describe("toggleChoice", () => {
  it("adds a missing item and removes a present one", () => {
    expect(toggleChoice(["a"], "b", 3)).toEqual(["a", "b"]);
    expect(toggleChoice(["a", "b"], "a", 3)).toEqual(["b"]);
  });

  it("does not go past the maximum, but still allows removing", () => {
    expect(toggleChoice(["a", "b", "c"], "d", MAX_STYLES)).toEqual(["a", "b", "c"]);
    expect(toggleChoice(["a", "b", "c"], "c", MAX_STYLES)).toEqual(["a", "b"]);
  });

  it("never changes the list it was given", () => {
    const original = ["a"];
    toggleChoice(original, "b", 3);
    expect(original).toEqual(["a"]);
  });
});
