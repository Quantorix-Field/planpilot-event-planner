import type { CSSProperties } from "react";
import { EVENT_TYPES, type EventType } from "../../shared/schema";
import { DonutChart } from "../components/DonutChart";
import { formatInr } from "../format";
import {
  EVENT_BLURBS,
  EXAMPLE,
  HOME_STEPS,
  INDIA_CHIPS,
  TRUST_POINTS,
  exampleBudget,
} from "../homeContent";
import { Link, usePageMeta } from "../router";

const PETALS = [0, 1, 2, 3, 4, 5];
const LAMPS = [0, 1, 2, 3, 4];

/** Hands a number to the stylesheet, which uses it for animation timing. */
const order = (index: number) => ({ "--i": index }) as CSSProperties;

function EventIcon({ type }: { type: EventType }) {
  return (
    <svg className="event-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {type === "wedding" ? (
        <>
          <circle cx="18" cy="28" r="11" />
          <circle cx="30" cy="28" r="11" />
          <path d="M24 6 L27 12 L24 18 L21 12 Z" className="icon-fill" />
        </>
      ) : null}
      {type === "birthday" ? (
        <>
          <rect x="8" y="26" width="32" height="14" rx="3" />
          <path d="M8 32 Q16 36 24 32 T40 32" />
          <path d="M24 26 V16" />
          <path d="M24 5 C28 10 27 14 24 15 C21 14 20 10 24 5 Z" className="icon-fill" />
        </>
      ) : null}
      {type === "community" ? (
        <>
          <circle cx="24" cy="15" r="6" />
          <circle cx="10" cy="20" r="4" />
          <circle cx="38" cy="20" r="4" />
          <path d="M12 41 C12 31 36 31 36 41" />
          <path d="M2 38 C2 32 8 29 13 30" />
          <path d="M46 38 C46 32 40 29 35 30" />
        </>
      ) : null}
    </svg>
  );
}

function Hero() {
  return (
    <section className="hero on-dark" aria-labelledby="hero-title">
      <div className="container-wide hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">An AI event planner made for India</p>
          <h1 id="hero-title">Every celebration begins with a spark.</h1>
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
          <ul className="hero-facts">
            <li>Budget in ₹</li>
            <li>Timeline from your date</li>
            <li>Vendor checklist</li>
            <li>Ideas for your vibe</li>
          </ul>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-glow" />
          <img
            className="hero-plane"
            src="/logo-plane-white.png"
            alt=""
            width="256"
            height="200"
          />
          {PETALS.map((index) => (
            <span key={index} className="hero-petal" style={order(index)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="section container-wide" aria-labelledby="how-title">
      <div className="how-grid">
        <div className="how-aside">
          <img className="how-plane" src="/logo-plane.png" alt="" width="128" height="100" />
          <h2 id="how-title">Three steps. Zero stress.</h2>
          <p className="lead">One form in. A plan you can tick off, out.</p>
          <Link to="/plan" className="btn btn-primary">
            Plan my celebration
          </Link>
        </div>
        <ol className="steps steps-stack">
          {HOME_STEPS.map((step, index) => (
            <li key={step.title} className="card step">
              <span className="step-num" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ExamplePlan() {
  const budget = exampleBudget();
  return (
    <section className="section example" aria-labelledby="example-title">
      <div className="container-wide">
        <h2 id="example-title">One form in, a full plan out</h2>
        <p className="lead">Here is the kind of plan you get. Yours is built from your own details.</p>
        <article className="card example-card reveal" aria-label="Example plan">
          <p className="example-tag">Example plan · made-up numbers</p>
          <h3>{EXAMPLE.title}</h3>
          <p className="example-facts">{EXAMPLE.facts.join(" · ")}</p>
          <div className="example-grid">
            <DonutChart
              title="Where the budget goes"
              centre={formatInr(EXAMPLE.budgetInr)}
              items={budget.map((item) => ({
                label: item.category,
                value: item.amountInr,
                valueLabel: formatInr(item.amountInr),
              }))}
            />
            <div className="example-side">
              <h4>Timeline</h4>
              <ol className="example-timeline">
                {EXAMPLE.timeline.map((item) => (
                  <li key={item.when}>
                    <span className="example-when">{item.when}</span>
                    <span>{item.task}</span>
                  </li>
                ))}
              </ol>
              <h4>Book these first</h4>
              <ul className="example-vendors">
                {EXAMPLE.vendors.map((vendor) => (
                  <li key={vendor}>
                    <span className="badge badge-must-book">Must book</span> {vendor}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function EventTypes() {
  return (
    <section className="section container-wide" aria-labelledby="types-title">
      <h2 id="types-title">For every kind of celebration</h2>
      <p className="lead">Pick one and the form is ready for it.</p>
      <ul className="event-grid">
        {EVENT_TYPES.map((type) => (
          <li key={type}>
            <Link to={`/plan?type=${type}`} className="card event-card">
              <EventIcon type={type} />
              <h3>{EVENT_BLURBS[type].label}</h3>
              <p>{EVENT_BLURBS[type].text}</p>
              <span className="event-go">
                Plan a {EVENT_BLURBS[type].label.toLowerCase()} <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Honest() {
  return (
    <section className="section honest on-dark" aria-labelledby="honest-title">
      <div className="container-wide">
        <h2 id="honest-title">Honest by design</h2>
        <p className="lead">A plan is only useful if you can trust it.</p>
        <ul className="trust-grid">
          {TRUST_POINTS.map((point, index) => (
            <li key={point.title} className="trust-card" style={order(index)}>
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MadeForIndia() {
  return (
    <section className="section container-wide" aria-labelledby="india-title">
      <h2 id="india-title">Made for Indian celebrations</h2>
      <p className="lead">Rupees, dates and vendors that match how you really plan here.</p>
      <ul className="chips">
        {INDIA_CHIPS.map((chip, index) => (
          <li key={chip} className="chip" style={order(index)}>
            {chip}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Finale() {
  return (
    <section className="finale on-dark" aria-labelledby="finale-title">
      <div className="container-wide finale-inner">
        <ul className="lamps" aria-hidden="true">
          {LAMPS.map((index) => (
            <li key={index} className="lamp" style={order(index)}>
              <svg viewBox="-16 -26 32 44" focusable="false">
                <path className="lamp-flame" d="M0 -3 C-5 -9 -2 -15 0 -20 C2 -15 5 -9 0 -3Z" />
                <path className="lamp-bowl" d="M-9 0 H9 C9 8 4 12 0 12 C-4 12 -9 8 -9 0Z" />
              </svg>
            </li>
          ))}
        </ul>
        <h2 id="finale-title">Your date is waiting.</h2>
        <p className="hero-sub">Start with a few details. We will carry the list.</p>
        <Link to="/plan" className="btn btn-primary">
          Plan my celebration
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta(null);

  return (
    <>
      <Hero />
      <div className="garland" aria-hidden="true" />
      <HowItWorks />
      <ExamplePlan />
      <EventTypes />
      <Honest />
      <MadeForIndia />
      <Finale />
    </>
  );
}
