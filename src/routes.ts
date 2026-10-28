import { z } from "zod";

/** Plan ids are UUIDs made by crypto.randomUUID(). Anything else is not a plan. */
export const planIdSchema = z.string().uuid();

export type Route =
  | { name: "home" }
  | { name: "plan" }
  | { name: "plans" }
  | { name: "planDetail"; id: string }
  | { name: "notFound" };

/** Maps a URL path to a route. Unknown paths and malformed ids give "notFound". */
export function matchRoute(pathname: string): Route {
  if (!pathname.startsWith("/")) return { name: "notFound" };
  const trimmed = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (trimmed === "/") return { name: "home" };
  const segments = trimmed.slice(1).split("/");
  if (segments.some((segment) => segment === "")) return { name: "notFound" };

  const [first, second, ...rest] = segments;
  if (rest.length > 0) return { name: "notFound" };
  if (first === "plan" && second === undefined) return { name: "plan" };
  if (first === "plans" && second === undefined) return { name: "plans" };
  if (first === "plans" && second !== undefined) {
    const id = planIdSchema.safeParse(second);
    return id.success ? { name: "planDetail", id: id.data } : { name: "notFound" };
  }
  return { name: "notFound" };
}

/** Splits "/plans?x=1#top" into its three parts. */
export function parseHref(href: string): { pathname: string; search: string; hash: string } {
  const hashAt = href.indexOf("#");
  const hash = hashAt >= 0 ? href.slice(hashAt) : "";
  const rest = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const queryAt = rest.indexOf("?");
  return {
    pathname: queryAt >= 0 ? rest.slice(0, queryAt) : rest,
    search: queryAt >= 0 ? rest.slice(queryAt) : "",
    hash,
  };
}

/** Only same-site paths are allowed as link targets: "/x" yes, "//evil.com" and "https://x" no. */
export function isSafeInternalPath(to: string): boolean {
  return /^\/(?![/\\])/.test(to) && !/[\u0000-\u0020\u007f]/.test(to);
}

/** True when `current` is the page `target`, or a page inside it ("/plans/abc" is inside "/plans"). */
export function isActivePath(current: string, target: string): boolean {
  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

const HOME_TITLE = "PlanPilot: plan the joy, we'll carry the list";

/** Page titles read "My plans · PlanPilot". The home page uses the full tagline. */
export function buildTitle(page: string | null): string {
  return page ? `${page} · PlanPilot` : HOME_TITLE;
}
