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

async function expectNoViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const found = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact ?? "n/a"}): ${violation.nodes
        .map((node) => node.target.join(" "))
        .join(" | ")}`,
  );
  expect(found).toEqual([]);
}

for (const [name, path] of PAGES) {
  test(`${name} page: no axe violations, no CSP errors, no sideways scroll`, async ({ page }) => {
    const problems = watchForProblems(page);
    await seedPlan(page);
    await page.goto(path);
    await page.locator("main").waitFor();

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
  const tabs = page.getByRole("tab");
  const count = await tabs.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    await tabs.nth(index).click();
    await expectNoViolations(page);
  }
});

test("the delete dialog passes axe and closes with Escape", async ({ page }) => {
  await seedPlan(page);
  await page.goto("/plans");
  await page.getByRole("button", { name: /^Delete/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expectNoViolations(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
