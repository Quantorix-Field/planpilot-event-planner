import { describe, expect, it } from "vitest";
import { applyMotion, readMotion, saveMotion } from "../src/motion";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
  };
}

const blockedStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("readMotion", () => {
  it("defaults to on", () => {
    expect(readMotion(fakeStorage())).toBe("on");
    expect(readMotion(null)).toBe("on");
  });

  it("reads a saved choice", () => {
    expect(readMotion(fakeStorage({ "planpilot:motion": "off" }))).toBe("off");
    expect(readMotion(fakeStorage({ "planpilot:motion": "on" }))).toBe("on");
  });

  it("ignores corrupted values and blocked storage", () => {
    expect(readMotion(fakeStorage({ "planpilot:motion": "maybe" }))).toBe("on");
    expect(readMotion(fakeStorage({ "planpilot:motion": "<script>" }))).toBe("on");
    expect(readMotion(blockedStorage)).toBe("on");
  });
});

describe("saveMotion", () => {
  it("stores the choice", () => {
    const storage = fakeStorage();
    saveMotion("off", storage);
    expect(storage.data["planpilot:motion"]).toBe("off");
    expect(readMotion(storage)).toBe("off");
  });

  it("never throws when storage is blocked or missing", () => {
    saveMotion("off", blockedStorage);
    saveMotion("off", null);
    expect(true).toBe(true);
  });
});

describe("applyMotion", () => {
  function fakeRoot() {
    const attributes: Record<string, string> = {};
    return {
      attributes,
      setAttribute: (name: string, value: string) => {
        attributes[name] = value;
      },
      removeAttribute: (name: string) => {
        delete attributes[name];
      },
    };
  }

  it("sets data-motion=off when paused and removes it when on", () => {
    const root = fakeRoot();
    applyMotion("off", root);
    expect(root.attributes["data-motion"]).toBe("off");
    applyMotion("on", root);
    expect("data-motion" in root.attributes).toBe(false);
  });
});
