import { describe, expect, it } from "vitest";
import { parsePlanQuery } from "../src/planQuery";

const ID = "3f2b8c1e-5d4a-4b7e-9c1d-2a6f8e0b4c7d";

describe("parsePlanQuery", () => {
  it("reads a valid type and a valid plan id", () => {
    expect(parsePlanQuery("?type=wedding")).toEqual({ type: "wedding" });
    expect(parsePlanQuery("?type=birthday")).toEqual({ type: "birthday" });
    expect(parsePlanQuery("?type=community")).toEqual({ type: "community" });
    expect(parsePlanQuery(`?edit=${ID}`)).toEqual({ edit: ID });
    expect(parsePlanQuery(`?type=wedding&edit=${ID}`)).toEqual({ type: "wedding", edit: ID });
  });

  it("works with or without the leading question mark", () => {
    expect(parsePlanQuery("type=wedding")).toEqual({ type: "wedding" });
  });

  it("ignores values that are not allowed", () => {
    expect(parsePlanQuery("?type=funeral")).toEqual({});
    expect(parsePlanQuery("?type=WEDDING")).toEqual({});
    expect(parsePlanQuery("?type=")).toEqual({});
    expect(parsePlanQuery("?edit=abc")).toEqual({});
    expect(parsePlanQuery("?edit=<script>alert(1)</script>")).toEqual({});
    expect(parsePlanQuery("?edit=../../etc/passwd")).toEqual({});
  });

  it("keeps the good value when the other one is bad", () => {
    expect(parsePlanQuery(`?type=nope&edit=${ID}`)).toEqual({ edit: ID });
    expect(parsePlanQuery("?type=birthday&edit=nope")).toEqual({ type: "birthday" });
  });

  it("returns nothing for an empty or unrelated query", () => {
    expect(parsePlanQuery("")).toEqual({});
    expect(parsePlanQuery("?x=1&y=2")).toEqual({});
  });
});
