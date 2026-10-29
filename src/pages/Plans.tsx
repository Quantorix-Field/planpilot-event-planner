import { Link, usePageMeta } from "../router";

export default function Plans() {
  usePageMeta("My plans");

  return (
    <div className="container page">
      <h1>My plans</h1>
      <section className="card empty-state" aria-labelledby="empty-title">
        <h2 id="empty-title">No plans yet</h2>
        <p>Your plans will appear here. They stay on this device.</p>
        <Link to="/plan" className="btn btn-primary">
          Plan your first celebration
        </Link>
      </section>
    </div>
  );
}
