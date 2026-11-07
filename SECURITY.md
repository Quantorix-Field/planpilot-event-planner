# Security

PlanPilot has no accounts and no database. A visitor's plans stay in their own browser. The only server route is `POST /api/plan`, which checks a request and relays it to Google Gemini.

## What is protected

- **The Gemini API key.** It lives only in a Vercel environment variable, is read on the server, and is sent to Google in a request header, never in a URL. It is not in the browser bundle or the repository (`.env.example` is blank).
- **Visitors' plans.** They are kept in `localStorage` on the visitor's device and are never sent to a database. The server does not store requests or plans.

## Threats and controls

| Threat | Control |
| --- | --- |
| Abuse and cost | 10 requests per minute per IP, a 10,000-character body limit, POST with JSON only, and a 52-second total time budget with at most 3 models tried. |
| Hostile or malformed input | The server validates every field with zod (ranges, lengths, dates). Tradition, food and style choices must match fixed lists, so free text cannot reach those fields. |
| Prompt injection | Event details are sent to the AI as JSON data. The instructions tell it to treat every value, especially the notes, as plain data and never as instructions. |
| Bad or unsafe AI output | The reply must match a structured-output schema and is validated again with zod. The AI returns percentages only. Exact rupee amounts and dates are computed in code. |
| AI outage | Backup models are tried, then a built-in rule-based starter plan is returned. It is clearly labelled as not made by the AI. A blocked prompt or a real bug is not hidden behind it. |
| Information leaks | Users see fixed, safe error messages. Logs hold only status codes and error names, never prompts, plans or keys. API responses are sent with `Cache-Control: no-store`. |
| Cross-site scripting | React escapes all text, and the code never uses `dangerouslySetInnerHTML`, `innerHTML` or `eval`. A strict Content Security Policy allows only same-origin scripts, styles and connections, with images limited to same-origin and `data:`. No third-party scripts, fonts or CDNs are used. |
| Clickjacking and browser features | `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, a strict referrer policy, and a permissions policy that turns off camera, microphone and location. |
| Tampered saved data or links | Saved plans are validated again when loaded, and invalid ones are dropped. Plan links must be UUIDs, and any other path shows the not-found page. |
| Regressions | CI runs type-checking, strict ESLint (including accessibility rules), tests with a coverage floor, a production build, and axe in a real browser under the same security headers as production. CI has read-only permissions. |

## Known limits

- The rate limiter is held in memory. On serverless, each warm instance keeps its own counts, so it is a best-effort guard against bursts, not a hard global cap.
- There is no sign-in by design. Anyone with the link can use the planner within the rate limit.
- `localStorage` is not encrypted. Anyone with access to the device and browser profile can read saved plans, so avoid entering anything private in the notes field.
- AI suggestions can be wrong. Treat budgets, vendors and timelines as a starting point and confirm them with real quotes.

## Reporting a problem

Please use the repository's **Security** tab and choose **Report a vulnerability**, if it is available. Otherwise open an issue that describes the area affected without exploit details, and the maintainer will follow up.
