import type { MouseEvent, ReactNode } from "react";
import { Link, NavLink } from "../router";
import { MotionToggle } from "./MotionToggle";
function skipToMain(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  document.getElementById("main")?.focus();
}

function SiteHeader() {
  return (
    <header className="site-header on-dark no-print">
      <div className="container-wide header-inner">
        <Link to="/" className="brand">
          <img src="/logo-mark.png" alt="" width="40" height="40" />
          <span>PlanPilot</span>
        </Link>
        <nav aria-label="Main">
          <ul className="nav-list">
            <li>
              <NavLink to="/" className="nav-link">
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/plans" className="nav-link">
                My plans
              </NavLink>
            </li>
            <li>
              <NavLink to="/#how-it-works" className="nav-link">
                How it works
              </NavLink>
            </li>
            <li>
              <NavLink to="/plan" className="btn btn-primary btn-small">
                Plan my celebration
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer on-dark no-print">
      <div className="container-wide footer-inner">
        <p className="footer-brand">Plan the joy. We'll carry the list.</p>
        <nav aria-label="Footer">
          <ul className="footer-links">
            <li>
              <Link to="/" className="footer-link">
                Home
              </Link>
            </li>
            <li>
              <Link to="/plan" className="footer-link">
                Plan my celebration
              </Link>
            </li>
            <li>
              <Link to="/plans" className="footer-link">
                My plans
              </Link>
            </li>
            <li>
              <Link to="/#how-it-works" className="footer-link">
                How it works
              </Link>
            </li>
          </ul>
        </nav>
        <p className="footer-note">
          Plans are drafted by Google Gemini and saved only in this browser. They are estimates, not
          quotes: always confirm prices with vendors.
        </p>
                <div>
          <MotionToggle />
        </div>
      </div>
    </footer>
  );
}

/** Skip link, header, main landmark and footer, shown on every page. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main" onClick={skipToMain}>
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
