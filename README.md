# PlanPilot

**AI-powered celebration planner and visual event blueprint engine for Indian events**

Built for **Google PromptWars Virtual (Hack2Skill) — Challenge 5**

🔗 **Live app:** https://planpilot-event-planner.vercel.app

🔗 **Repository:** https://github.com/Quantorix-Field/planpilot-event-planner.git

---

## Chosen Vertical

**AI Event Planning & Hospitality Management**

Organizing large-scale celebrations in India (weddings, anniversaries, milestone birthdays) involves navigating complex logistics—city-specific venue costs, seasonal vendor pricing, guest headcounts, and multi-tier timelines. PlanPilot turns this multi-week manual coordination process into an instant, structured, and interactive blueprint tailored to Indian celebration standards.

Rather than offering generic AI responses, PlanPilot acts as an intelligent end-to-end event operating system:

- **City & Tier-Aware Budget Allocation** — Instant budget breakdown calculated in Indian Rupees (₹), tailored to host cities across Metro and Tier-2 regions.
- **Visual Cost Breakdown** — An interactive SVG donut chart offering clear visual distribution across Venue, Catering, Decor, Photography, and Contingency.
- **Time-Horizon Milestone Checklist** — Automated action items broken down into clear planning phases (*6 months before*, *1 month before*, *1 week before*) with persistent task tracking.
- **Curated Local Vibe & Vendor Recommendations** — Actionable vendor checklist items and theme inspirations calibrated to the selected event type and city.
- **Offline Fallback Guarantee** — Resilient fallback system ensuring users receive a mathematically sound budget blueprint even during network drops or API rate limiting.

---

## Approach and Logic

The core design principle behind PlanPilot is **zero-hallucination structured accuracy.** A generic chatbot offering rough text estimates is not actionable for an event host. Instead, PlanPilot enforces strict structure using serverless AI generation coupled with client-side verification:

1. **Structured Schema Prompting:** When a user submits event parameters (Event Type, Host City, Guest Count, Total Budget in ₹, Target Date), the backend constructs a constrained prompt enforced by Google Gemini (`gemini-2.5-flash`).
2. **Serverless API Security:** The Gemini API key is isolated inside Vercel serverless functions (`api/plan.ts`). The browser client never handles secret keys.
3. **Mathematical Recalculation Engine:** The raw AI payload is passed through `shared/finalize.ts` to verify budget math, re-balance category percentages, and validate timeline milestones before rendering.
4. **Resilient Fallback Protection:** If API limits are exceeded or connectivity fails, `server/fallback.ts` dynamically generates a mathematically sound, deterministic blueprint so user flow is never disrupted.

---

## How the Solution Works

**User Flow:**

1. A user opens the app and enters event details: Event Type (e.g., Wedding, Milestone Birthday), City (e.g., Jaipur, Mumbai, Delhi NCR), Guest Count, Total Budget (₹), and Date.
2. Upon submission, the payload is sent to `/api/plan` where the serverless handler queries the Gemini API using structured JSON parameters.
3. The response passes through the math verification engine to ensure exact sum matching and category distribution.
4. The client renders the full blueprint: an interactive SVG donut chart, detailed budget breakdown cards, time-horizon milestone checklists, and curated vendor notes.
5. All generated plans, task states, and custom notes automatically persist in browser `localStorage`.

**Technical Architecture:**

```
planpilot-event-planner/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions — lint, typecheck, unit & E2E tests
├── api/
│   └── plan.ts                 # Vercel serverless proxy for Gemini API requests
├── server/
│   ├── gemini.ts               # Google Gemini integration & structured prompt builder
│   ├── fallback.ts             # Deterministic fallback engine for offline recovery
│   ├── handler.ts              # Core server request routing and payload validation
│   └── rateLimit.ts            # Client IP rate limiter
├── shared/
│   ├── schema.ts               # Shared TypeScript interfaces & Zod validation rules
│   ├── finalize.ts             # Math re-calculation engine for budget & timeline integrity
│   ├── formOptions.ts          # Supported Indian event types and city presets
│   └── starterPlan.ts          # Default blueprint templates
├── src/
│   ├── components/             # BudgetPanel, Checklist, DonutChart, Garland, Mandala, etc.
│   ├── pages/                  # Home, NewPlan, Plans, PlanDetail, NotFound
│   ├── planStore.ts            # LocalStorage state management hook
│   └── styles.css              # Tailwind CSS & custom Indian festive design tokens
└── tests/                      # Vitest & Playwright E2E test suite
```

---

## Assumptions Made

- **Budget Currencies & Formats:** Budgets are calculated in Indian Rupees (₹) following standard Indian hospitality expense ratios (e.g., Catering and Venue accounting for the majority tier of total expenditure).
- **Offline Fallbacks:** Deterministic fallback mathematical models are built into `server/fallback.ts` to ensure full platform functionality even if rate limits occur.
- **Client-Side Persistence:** Plans are stored locally via `localStorage` so users can track checklist completion across returning sessions without requiring database login flows.

---

## Tech Stack

React 18 · TypeScript 5.4 · Vite 5 · Google Gemini API (`@google/genai`) · Vercel Serverless Functions · Tailwind CSS · Vitest · Playwright · GitHub Actions CI

---

## Running Locally

```bash
# Clone repository
git clone https://github.com/Quantorix-Field/planpilot-event-planner.git
cd planpilot-event-planner

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Add your GEMINI_API_KEY inside .env

# Start local development server
npm run dev

# TypeScript type verification
npm run typecheck

# Execute test suite
npm test

# Build for production
npm run build
```

---

_Built for Google PromptWars Virtual — Challenge 5._
