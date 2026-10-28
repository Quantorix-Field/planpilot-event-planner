import {
  useEffect,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";
import { buildTitle, isActivePath, isSafeInternalPath, parseHref } from "./routes";

const NAVIGATE_EVENT = "planpilot:navigate";

function currentHref(): string {
  return window.location.pathname + window.location.search + window.location.hash;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

/** The current location, kept in sync with the browser's back and forward buttons. */
export function useLocation(): { pathname: string; search: string; hash: string } {
  const href = useSyncExternalStore(subscribe, currentHref, () => "/");
  return parseHref(href);
}

function focusElement(element: HTMLElement): void {
  if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "-1");
  element.focus({ preventScroll: true });
}

/**
 * Moves the reader to the right place after navigation: the "#section" if there is one,
 * otherwise the top of the page with focus on the main heading.
 */
function moveFocus(hash: string, initialLoad: boolean): void {
  const id = hash.startsWith("#") ? hash.slice(1) : "";
  if (/^[A-Za-z][\w-]*$/.test(id)) {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ block: "start" });
      focusElement(target);
      return;
    }
  }
  if (initialLoad) return;
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  const heading = document.querySelector<HTMLElement>("main h1");
  if (heading) focusElement(heading);
}

export function navigate(to: string, options: { replace?: boolean } = {}): void {
  const target = isSafeInternalPath(to) ? to : "/";
  if (target === currentHref()) {
    moveFocus(window.location.hash, false);
    return;
  }
  if (options.replace) window.history.replaceState(null, "", target);
  else window.history.pushState(null, "", target);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

let isFirstPage = true;

/**
 * Call once at the top of every page. Sets the tab title and, after a navigation,
 * scrolls to the top and focuses the page's h1 so screen readers announce the new page.
 */
export function usePageMeta(title: string | null): void {
  const { hash } = useLocation();
  useEffect(() => {
    document.title = buildTitle(title);
  }, [title]);
  useEffect(() => {
    const initialLoad = isFirstPage;
    isFirstPage = false;
    moveFocus(hash, initialLoad);
  }, [hash]);
}

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  replace?: boolean;
};

/** A normal link that changes page without a reload. Ctrl/Cmd-click still opens a new tab. */
export function Link({ to, replace, onClick, ...rest }: LinkProps) {
  const href = isSafeInternalPath(to) ? to : "/";

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (rest.target && rest.target !== "_self") return;
    event.preventDefault();
    navigate(href, { replace });
  }

  return <a {...rest} href={href} onClick={handleClick} />;
}

/** A Link that sets aria-current="page" when it points at the page being shown. */
export function NavLink({ to, ...rest }: LinkProps) {
  const { pathname } = useLocation();
  const target = parseHref(to);
  const active = target.hash === "" && isActivePath(pathname, target.pathname);
  return <Link to={to} aria-current={active ? "page" : undefined} {...rest} />;
}
