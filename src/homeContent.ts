import { normalizeBudget } from "../shared/finalize";
import type { EventType } from "../shared/schema";

export const HOME_STEPS = [
  { title: "Tell us the basics", text: "Date, guests, budget and city. One short form." },
  { title: "We draft the plan", text: "Budget, timeline, vendors and ideas in seconds." },
  { title: "You celebrate", text: "Tick things off as they get done." },
] as const;

/** Made-up numbers for the sample plan on the homepage. The page labels them as an example. */
export const EXAMPLE = {
  title: "Wedding in Jaipur",
  facts: ["150 guests", "₹15,00,000 budget", "Winter dates"],
  budgetInr: 1_500_000,
  budget: [
    { category: "Venue", percent: 30, note: "Lawn venue with a mandap." },
    { category: "Catering", percent: 35, note: "Vegetarian menu with a live counter." },
    { category: "Decor", percent: 15, note: "Marigold and fairy lights." },
    { category: "Photography", percent: 10, note: "Two photographers." },
    { category: "Music", percent: 10, note: "Dhol and a DJ." },
  ],
  timeline: [
    { when: "6 months before", task: "Book the venue and the caterer" },
    { when: "3 months before", task: "Hire the photographer and decorator" },
    { when: "1 month before", task: "Send invitations and confirm the menu" },
    { when: "1 week before", task: "Final headcount and vendor call" },
  ],
  vendors: ["Venue", "Caterer"],
} as const;

/** The example budget in rupees, using the same rounding as every real plan. */
export function exampleBudget() {
  return normalizeBudget([...EXAMPLE.budget], EXAMPLE.budgetInr);
}

export const EVENT_BLURBS: Record<EventType, { label: string; text: string }> = {
  wedding: {
    label: "Wedding",
    text: "Many rituals, a long guest list and a lot of vendors, in one clear plan.",
  },
  birthday: {
    label: "Birthday",
    text: "From a milestone dinner to a big party, with a budget that fits.",
  },
  community: {
    label: "Community event",
    text: "Pujas, society festivals and fundraisers, planned for a crowd.",
  },
};

export const TRUST_POINTS = [
  {
    title: "The maths is ours",
    text: "The AI suggests the split. Our code turns it into rupees that add up to exactly your budget.",
  },
  {
    title: "Estimates, not quotes",
    text: "Prices are realistic guides for your city. Always confirm with vendors.",
  },
  {
    title: "Your plans stay with you",
    text: "Your answers go to Google Gemini only to draft the plan. Plans are saved in this browser, with no sign-up.",
  },
  {
    title: "You stay in control",
    text: "Stop a draft at any time, edit your details, or pause every animation.",
  },
] as const;

export const INDIA_CHIPS = [
  "Rupees in lakhs and crores",
  "Dates in IST",
  "Mehendi and sangeet",
  "Pandit and mandap",
  "Halwai and caterers",
  "Dhol and DJ",
  "Haldi and decor",
  "Community pujas",
] as const;
