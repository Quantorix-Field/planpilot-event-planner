import { Link, usePageMeta } from "../router";

const STEPS = [
  { title: "Tell us the basics", text: "Date, guests, budget and city." },
  { title: "We draft the plan", text: "Budget, timeline, vendors and ideas in seconds." },
  { title: "You celebrate", text: "Tick things off as they get done." },
] as const;

export default function Home() {
  usePageMeta(null);

  return (
    <>
      <section className="hero on-dark">
        <div className="container-wide">
          <h1>Every celebration begins with a spark.</h1>
          <p className="hero-sub">
            Tell us a date, a number and a dream. PlanPilot builds the rest.
          </p>
          <div className="btn-row">
            <Link to="/plan" className="btn btn-primary">
              Plan my celebration
            </Link>
            <Link to="/#how-it-works" className="btn btn-light">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section container-wide" aria-labelledby="how-title">
        <h2 id="how-title">Three steps. Zero stress.</h2>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card step">
              <span className="step-num" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        <Link to="/plan" className="btn btn-primary">
          Plan my celebration
        </Link>
      </section>
    </>
  );
}
