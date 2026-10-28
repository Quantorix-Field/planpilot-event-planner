import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Link, NavLink } from "../src/router";
import {
  buildTitle,
  isActivePath,
  isSafeInternalPath,
  matchRoute,
  parseHref,
} from "../src/routes";

const ID = "3f2b8c1e-5d4a-4b7e-9c1d-2a6f8e0b4c7d";

describe("matchRoute", () => {
  it("matches the four pages", () => {
    expect(matchRoute("/")).toEqual({ name: "home" });
    expect(matchRoute("/plan")).toEqual({ name: "plan" });
    expect(matchRoute("/plans")).toEqual({ name: "plans" });
    expect(matchRoute(`/plans/${ID}`)).toEqual({ name: "planDetail", id: ID });
  });

  it("ignores one trailing slash", () => {
    expect(matchRoute("/plans/")).toEqual({ name: "plans" });
    expect(matchRoute(`/plans/${ID}/`)).toEqual({ name: "planDetail", id: ID });
  });

  it("rejects a plan id that is not a UUID", () => {
    expect(matchRoute("/plans/abc")).toEqual({ name: "notFound" });
    expect(matchRoute("/plans/<script>")).toEqual({ name: "notFound" });
    expect(matchRoute("/plans/..%2F..")).toEqual({ name: "notFound" });
  });

  it("returns notFound for everything else", () => {
    for (const path of [
      "/nope",
      "/Plans",
      "//plans",
      "/plans//",
      "/plan/extra",
      `/plans/${ID}/edit`,
      "/api/plan",
      "plans",
      "",
    ]) {
      expect(matchRoute(path)).toEqual({ name: "notFound" });
    }
  });
});

describe("parseHref", () => {
  it("splits path, query and hash", () => {
    expect(parseHref("/plan?type=wedding#top")).toEqual({
      pathname: "/plan",
      search: "?type=wedding",
      hash: "#top",
    });
    expect(parseHref("/#how-it-works")).toEqual({ pathname: "/", search: "", hash: "#how-it-works" });
    expect(parseHref("/plans")).toEqual({ pathname: "/plans", search: "", hash: "" });
  });
});

describe("isSafeInternalPath", () => {
  it("allows same-site paths only", () => {
    expect(isSafeInternalPath("/")).toBe(true);
    expect(isSafeInternalPath("/plan?type=birthday")).toBe(true);
    expect(isSafeInternalPath("/#how-it-works")).toBe(true);
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "plans", "", "/a b", "/a\nb"]) {
      expect(isSafeInternalPath(bad)).toBe(false);
    }
  });
});

describe("isActivePath", () => {
  it("treats / as exact and other pages as a prefix", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/plans", "/")).toBe(false);
    expect(isActivePath("/plans", "/plans")).toBe(true);
    expect(isActivePath(`/plans/${ID}`, "/plans")).toBe(true);
    expect(isActivePath("/planet", "/plan")).toBe(false);
  });
});

describe("buildTitle", () => {
  it("adds the site name, and uses the tagline for the home page", () => {
    expect(buildTitle("My plans")).toBe("My plans · PlanPilot");
    expect(buildTitle(null)).toContain("PlanPilot");
    expect(buildTitle(null)).toContain("carry the list");
  });
});

describe("Link and NavLink markup", () => {
  it("renders a real anchor with the target as href", () => {
    const html = renderToStaticMarkup(<Link to="/plans" className="x">My plans</Link>);
    expect(html).toBe('<a class="x" href="/plans">My plans</a>');
  });

  it("falls back to / for an unsafe target", () => {
    expect(renderToStaticMarkup(<Link to="//evil.com">x</Link>)).toContain('href="/"');
    expect(renderToStaticMarkup(<Link to="https://evil.com">x</Link>)).toContain('href="/"');
  });

  it("marks only the current page with aria-current", () => {
    expect(renderToStaticMarkup(<NavLink to="/">Home</NavLink>)).toContain('aria-current="page"');
    expect(renderToStaticMarkup(<NavLink to="/plans">Plans</NavLink>)).not.toContain("aria-current");
    expect(renderToStaticMarkup(<NavLink to="/#how-it-works">How</NavLink>)).not.toContain("aria-current");
  });
});
