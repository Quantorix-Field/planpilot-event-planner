import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PLAN_ID = "3f2b8c1e-6a4d-4e7b-9c10-5d2a7e8f9b01";
const SAVED_AT = "2026-11-01T10:00:00.000Z";

const SAVED = {
  version: 2,
  plans: [
    {
      id: PLAN_ID,
      createdAt: SAVED_AT,
      updatedAt: SAVED_AT,
      request: {
        eventType: "wedding",
        eventDate: "2099-12-12",
        guestCount: 150,
        budgetInr: 1_500_000,
        city: "Jaipur",
        vibe: "",
      },
      plan: {
        summary: "A 150-guest wedding in Jaipur.",
        daysUntilEvent: 60,
        budget: [
          { category: "Venue", percent: 30, amountInr: 450_000, note: "Lawn venue." },
          { category: "Catering", percent: 35, amountInr: 525_000, note: "About ₹3,500 per guest." },
          { category: "Decor", percent: 15, amountInr: 225_000, note: "Marigold mandap." },
          { category: "Photography", percent: 10, amountInr: 150_000, note: "Two photographers." },
          { category: "Music", percent: 10, amountInr: 150_000, note: "DJ and dhol." },
        ],
        timeline: [
          { dueDate: "2099-06-15", daysBefore: 180, task: "Book the venue" },
          { dueDate: "2099-10-01", daysBefore: 60, task: "Send invitations" },
          { dueDate: "2099-12-12", daysBefore: 0, task: "Wedding day" },
        ],
        vendors: [
          { name: "Venue", priority: "must-book", estimatedCostInr: 450_000, tip: "Visit on a weekday." },
          { name: "Photographer", priority: "recommended", estimatedCostInr: 90_000, tip: "Ask for a sample album." },
                    { name: "Caterer", priority: "must-book", estimatedCostInr: 525_000, tip: "Book a tasting." },
          { name: "DJ", priority: "optional", estimatedCostInr: 40_000, tip: "Share a no-play list." },
        ],
        ideas: [
          { title: "Haldi on the lawn", description: "Yellow marigold seating." },
          { title: "Chai counter", description: "Kulhad chai for guests." },
          { title: "Dhol welcome", description: "Live dhol at the entrance." },
        ],
      },
      checked: [],
    },
  ],
};

const PAGES = [
  ["home", "/"],
  ["new plan", "/plan"],
  ["saved plans", "/plans"],
  ["plan detail", `/plans/${PLAN_ID}`],
  ["not found", "/no-such-page"],
] as const;

/** Puts one saved plan in localStorage before any page script runs. */
async function seedPlan(page: Page): Promise<void> {
  await page.addInitScript((saved: string) => {
    try {
      window.localStorage.setItem("planpilot:v2", saved);
    } catch {
      /* storage can be blocked; the page must cope */
    }
  }, JSON.stringify(SAVED));
}

/** Collects script errors and CSP refusals, which would mean the page breaks on Vercel. */
function watchForProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (/content security policy|refused to/i.test(message.text())) problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  return problems;
}

/** Fails with a one-line summary, so the CI annotation title names the rule and element. */
async function expectNoViolations(page: Page, where = "page"): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  if (results.violations.length === 0) return;
  const found = results.violations.map((violation) => {
    const nodes = violation.nodes.slice(0, 3);
    const where3 = nodes.map((node) => node.target.join(" ")).join(" | ");
    const why = (nodes[0]?.any[0]?.message ?? nodes[0]?.all[0]?.message ?? "").slice(0, 160);
    return `${violation.id} (${violation.impact ?? "n/a"}) at ${where3} - ${why}`;
  });
  throw new Error(`AXE on ${where}: ${found.join(" ;; ")}`);
}

for (const [name, path] of PAGES) {
  test(`${name} page: no axe violations, no CSP errors, no sideways scroll`, async ({ page }) => {
    const problems = watchForProblems(page);
    await seedPlan(page);
    await page.goto(path);
        await page.locator("main").waitFor();
    // The plan page must be audited with the plan on screen, not while it loads.
    if (path.startsWith("/plans/")) await page.getByRole("tablist").waitFor();

    await expectNoViolations(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });
}

test("every tab of a plan passes axe", async ({ page }) => {
  await seedPlan(page);
    await page.goto(`/plans/${PLAN_ID}`);
  await page.getByRole("tablist").waitFor();
  const tabs = page.getByRole("tab");
  const count = await tabs.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
        const label = (await tabs.nth(index).innerText()).trim();
    await tabs.nth(index).click();
    await expectNoViolations(page, `tab "${label}"`);
  }
});

test("the delete dialog passes axe and closes with Escape", async ({ page }) => {
  await seedPlan(page);
  await page.goto("/plans");
  await page.getByRole("button", { name: /^Delete/ }).first().click();
  const dialog = page.getByRole("dialog");
   await expect(dialog).toBeVisible();
  await expectNoViolations(page, "delete dialog");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

/** Fills the first step with a valid wedding. */
async function fillBasics(page: Page): Promise<void> {
  await page.getByLabel("Wedding", { exact: true }).check();
  await page.getByLabel("Event date").fill("2099-12-12");
  await page.getByLabel("Number of guests").fill("150");
  await page.getByLabel(/Total budget/).fill("1500000");
  await page.getByLabel("City", { exact: true }).fill("Jaipur");
}

test("both form steps pass axe, and the chips and Back button work", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/plan");
  await page.locator("main").waitFor();

  // An empty first step shows its errors and stays on step 1.
  await page.getByRole("button", { name: /^Next/ }).click();
  await expect(page.getByRole("heading", { name: /Step 1 of 2/ })).toBeVisible();
  await expectNoViolations(page, "form step 1 with errors");

  // A valid first step moves to step 2 and puts focus on its heading.
  await fillBasics(page);
  await page.getByRole("button", { name: /^Next/ }).click();
  await expect(page.getByRole("heading", { name: /Step 2 of 2/ })).toBeFocused();

  await page.getByLabel("Haldi").check();
  await page.getByLabel("Jain").check();
  for (const style of ["Traditional", "Modern", "Royal"]) {
    await page.getByLabel(style, { exact: true }).check();
  }
  await expect(page.getByLabel("Eco-friendly")).toBeDisabled();
  await expectNoViolations(page, "form step 2");

  // Back keeps what was typed.
  await page.getByRole("button", { name: "Back to basics" }).click();
  await expect(page.getByRole("heading", { name: /Step 1 of 2/ })).toBeFocused();
  await expect(page.getByLabel("City", { exact: true })).toHaveValue("Jaipur");
  expect(problems).toEqual([]);
});
