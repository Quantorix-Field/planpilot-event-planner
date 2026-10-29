import { Link, usePageMeta } from "../router";

/** Friendly dead end for an unknown address ("page") or an unknown plan id ("plan"). */
export default function NotFound({ kind }: { kind: "page" | "plan" }) {
  const isPlan = kind === "plan";
  usePageMeta(isPlan ? "Plan not found" : "Page not found");

  return (
    <div className="container page">
      <h1>{isPlan ? "We couldn't find that plan" : "This page is not here"}</h1>
      <p className="lead">
        {isPlan
          ? "It may have been deleted, or it was made on another device. Plans stay on the device where you made them."
          : "The link may be old or mistyped."}
      </p>
      <div className="btn-row">
        <Link to="/plan" className="btn btn-primary">
          Plan my celebration
        </Link>
        <Link to={isPlan ? "/plans" : "/"} className="btn btn-secondary">
          {isPlan ? "My plans" : "Go to the home page"}
        </Link>
      </div>
    </div>
  );
}
