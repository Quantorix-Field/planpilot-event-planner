import { Component, type ReactNode } from "react";

interface ErrorBoundaryState {
  failed: boolean;
}

/** Catches a page that crashes or fails to load, so the header and footer keep working. */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="container page" role="alert">
        <h1>Something went wrong</h1>
        <p>This page could not load. Check your connection and try again.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </div>
    );
  }
}
