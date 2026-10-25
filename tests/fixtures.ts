import type { AiPlan, PlanRequest, PlanResponse } from "../shared/schema";

export function makeRequest(overrides: Partial<PlanRequest> = {}): PlanRequest {
  return {
    eventType: "wedding",
    eventDate: "2099-12-12",
    guestCount: 150,
    budgetInr: 1_500_000,
    city: "Jaipur",
    vibe: "",
    ...overrides,
  };
}

export function makeAiPlan(overrides: Partial<AiPlan> = {}): AiPlan {
  return {
    summary: "A 150-guest wedding in Jaipur.",
    budget: [
      { category: "Venue", percent: 30, note: "Lawn venue." },
      { category: "Catering", percent: 35, note: "About ₹3,500 per guest." },
      { category: "Decor", percent: 15, note: "Marigold mandap." },
      { category: "Photography", percent: 10, note: "Two photographers." },
      { category: "Music", percent: 10, note: "DJ and dhol." },
    ],
    timeline: [
      { daysBefore: 180, task: "Book the venue" },
      { daysBefore: 120, task: "Hire the photographer" },
      { daysBefore: 60, task: "Send invitations" },
      { daysBefore: 30, task: "Confirm the menu" },
      { daysBefore: 7, task: "Final headcount" },
      { daysBefore: 0, task: "Wedding day" },
    ],
    vendors: [
      { name: "DJ", priority: "optional", estimatedCostInr: 40_000, tip: "Share a no-play list." },
      { name: "Venue", priority: "must-book", estimatedCostInr: 450_000, tip: "Visit on a weekday." },
      { name: "Photographer", priority: "recommended", estimatedCostInr: 90_000, tip: "Ask for a sample album." },
      { name: "Caterer", priority: "must-book", estimatedCostInr: 525_000, tip: "Book a tasting." },
    ],
    ideas: [
      { title: "Haldi on the lawn", description: "Yellow marigold seating." },
      { title: "Chai counter", description: "Kulhad chai for guests." },
      { title: "Dhol welcome", description: "Live dhol at the entrance." },
    ],
    ...overrides,
  };
}

export function makePlanResponse(overrides: Partial<PlanResponse> = {}): PlanResponse {
  return {
    summary: "A 150-guest wedding in Jaipur.",
    daysUntilEvent: 60,
    budget: [
      { category: "Venue", percent: 60, amountInr: 900_000, note: "Lawn venue." },
      { category: "Catering", percent: 40, amountInr: 600_000, note: "Menu." },
    ],
    timeline: [
      { dueDate: "2099-10-01", daysBefore: 60, task: "Book the venue" },
      { dueDate: "2099-12-12", daysBefore: 0, task: "Wedding day" },
    ],
    vendors: makeAiPlan().vendors,
    ideas: makeAiPlan().ideas,
    ...overrides,
  };
}
