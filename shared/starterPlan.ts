import { daysBetween } from "./finalize.js";
import { EVENT_TYPE_LABELS, type AiPlan, type EventType, type PlanRequest } from "./schema.js";

type Priority = AiPlan["vendors"][number]["priority"];

interface Template {
  /** [category, percent, note]. Notes may use {guests}, {city} and {perGuest}. */
  budget: [string, number, string][];
  /** [days before the event, task] for a plan with plenty of time. */
  timeline: [number, string][];
  /** [name, priority, share of the total budget, tip]. */
  vendors: [string, Priority, number, string][];
  ideas: [string, string][];
}

const TEMPLATES: Record<EventType, Template> = {
  wedding: {
    budget: [
      ["Venue", 20, "Lawn, banquet or hotel for {guests} guests in {city}; ask about all-inclusive packages."],
      ["Catering", 30, "About ₹{perGuest} per guest overall; the menu is usually the biggest single cost."],
      ["Decor and mandap", 12, "Stage, mandap, entrance and flowers; marigold is affordable and photographs well."],
      ["Photo and video", 8, "Candid photographer plus a videographer for the main functions."],
      ["Attire and jewellery", 12, "Outfits for the couple and close family, with tailoring time."],
      ["Music and entertainment", 6, "DJ, dhol or band, and sound for the sangeet."],
      ["Rituals and priest", 3, "Pandit, puja items and ceremony materials."],
      ["Invitations and gifts", 4, "Cards or digital invites, plus return gifts."],
      ["Travel and stay", 3, "Guest transport and rooms for out-of-town family."],
      ["Contingency", 2, "Keep a small reserve for last-minute needs."],
    ],
    timeline: [
      [270, "Fix the date with family and the priest, and set the total budget"],
      [240, "Shortlist and book the venue"],
      [180, "Book the caterer and photographer"],
      [150, "Finalise the guest list and start outfit shopping"],
      [90, "Send save-the-dates and book the decorator and music"],
      [60, "Send invitations and book guest travel and stay"],
      [30, "Hold the menu tasting and confirm every vendor in writing"],
      [14, "Final fittings and the function-by-function schedule"],
      [7, "Confirm the final headcount and settle vendor balances"],
      [1, "Check the venue setup and keep an emergency kit ready"],
    ],
    vendors: [
      ["Venue", "must-book", 0.2, "Visit on a weekday and ask what is included in the quote."],
      ["Caterer", "must-book", 0.3, "Taste the menu before booking and agree a per-plate rate in writing."],
      ["Photographer", "must-book", 0.08, "Ask to see a full wedding album, not only highlight reels."],
      ["Decorator", "recommended", 0.12, "Share reference photos so the quote matches your picture."],
      ["Priest or pandit", "recommended", 0.03, "Confirm the muhurat and the list of puja items early."],
      ["DJ or band", "optional", 0.06, "Share a must-play and a do-not-play list."],
    ],
    ideas: [
      ["Marigold mandap", "A mandap framed with marigold garlands is traditional, affordable and photographs well."],
      ["Mehendi and haldi corner", "A relaxed daytime setup with floor seating, flowers and a chai counter for family."],
      ["Welcome basket", "Small baskets with snacks, water and a schedule for out-of-town guests."],
      ["Live chaat counters", "Regional street food stations add variety and keep the menu lively."],
    ],
  },
  birthday: {
    budget: [
      ["Venue", 20, "Home, hall or restaurant space for {guests} guests in {city}."],
      ["Food and cake", 40, "About ₹{perGuest} per guest overall, including the cake and snacks."],
      ["Decor", 15, "Balloons, backdrop and table styling that match one theme."],
      ["Entertainment", 12, "Host, games, magician or music, suited to the age group."],
      ["Return gifts", 6, "A small useful gift for every guest."],
      ["Photography", 4, "A friend with a good camera or a short paid session."],
      ["Contingency", 3, "A small reserve for extra guests or supplies."],
    ],
    timeline: [
      [45, "Choose the theme, venue and total budget"],
      [30, "Book the venue and decide the guest list"],
      [21, "Order invitations and book entertainment"],
      [14, "Send invitations and order the cake"],
      [7, "Confirm the menu, decor and return gifts"],
      [3, "Confirm the final headcount with the caterer"],
      [1, "Set up the venue and pack supplies"],
    ],
    vendors: [
      ["Venue", "must-book", 0.2, "Ask about timings, cleaning fees and outside food rules."],
      ["Caterer or restaurant", "must-book", 0.35, "Agree a per-plate rate and a confirmed serving time."],
      ["Cake baker", "recommended", 0.05, "Order early and confirm the flavour and design in writing."],
      ["Decorator", "recommended", 0.15, "Pick one colour theme to keep the cost down."],
      ["Entertainer or host", "optional", 0.12, "Check what age group they usually work with."],
    ],
    ideas: [
      ["Theme corner", "A single photo corner with the theme colours gives every guest a picture spot."],
      ["Treasure hunt", "A short clue hunt keeps children busy and needs very little spending."],
      ["Memory wall", "Print photos of the year and let guests add notes to a board."],
      ["Build-your-own snack bar", "Chaat, sandwiches or pizza toppings that guests assemble themselves."],
    ],
  },
  community: {
    budget: [
      ["Venue and permissions", 15, "Ground or hall in {city}, plus any permits needed for {guests} people."],
      ["Food and prasad", 30, "About ₹{perGuest} per person overall; plan simple, quick-serve food."],
      ["Stage, sound and lights", 20, "Stage, microphones, speakers and basic lighting."],
      ["Decor", 12, "Entrance, stage backdrop and seating area."],
      ["Volunteers and logistics", 8, "Volunteer meals, badges, water and basic supplies."],
      ["Printing and publicity", 6, "Posters, banners and messages to residents."],
      ["Safety and first aid", 4, "First-aid kit, fire safety and crowd management."],
      ["Contingency", 5, "A reserve for weather cover and last-minute needs."],
    ],
    timeline: [
      [60, "Form the organising committee and set the budget"],
      [45, "Confirm the venue and apply for permissions"],
      [30, "Book sound, stage and food vendors"],
      [21, "Print posters and start publicity"],
      [14, "Assign volunteer roles and the day-of schedule"],
      [7, "Confirm vendors, power supply and weather cover"],
      [2, "Set up the venue and test the sound"],
    ],
    vendors: [
      ["Venue or ground", "must-book", 0.15, "Get the booking and permissions in writing."],
      ["Caterer", "must-book", 0.3, "Choose a menu that serves fast and works for different diets."],
      ["Sound and lights", "must-book", 0.2, "Ask for a backup microphone and a power backup."],
      ["Decorator", "recommended", 0.12, "Reuse the same decor across the stage and the entrance."],
      ["Printer", "recommended", 0.06, "Order posters early so they can be put up in time."],
    ],
    ideas: [
      ["Volunteer roster", "Share a simple sign-up sheet so every task has a named owner."],
      ["Children's activity corner", "Drawing and games keep families around for the whole programme."],
      ["Cultural performances", "Invite local groups to perform short, timed slots."],
      ["Green event", "Use steel plates and cloth banners to cut waste."],
    ],
  },
};

const inr = new Intl.NumberFormat("en-IN");

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/**
 * A fixed, rule-based plan used only when the AI service cannot be reached.
 * It follows the same shape as the AI plan, so the normal finishing step turns it into rupees and dates.
 */
export function buildStarterPlan(request: PlanRequest, today: string): AiPlan {
  const template = TEMPLATES[request.eventType];
  const daysUntil = Math.max(0, daysBetween(today, request.eventDate));
  const values = {
    guests: String(request.guestCount),
    city: request.city,
    perGuest: inr.format(Math.round(request.budgetInr / request.guestCount)),
  };

  const longest = Math.max(...template.timeline.map(([days]) => days));
  const scale = Math.min(1, daysUntil / longest);

  return {
    summary: `A starter plan for a ${request.guestCount}-guest ${EVENT_TYPE_LABELS[request.eventType].toLowerCase()} in ${request.city}, built from standard proportions rather than by the AI. Edit your details and try again for a tailored plan.`,
    budget: template.budget.map(([category, percent, note]) => ({
      category,
      percent,
      note: fill(note, values),
    })),
    timeline: template.timeline.map(([days, task]) => ({
      daysBefore: Math.min(daysUntil, Math.round(days * scale)),
      task,
    })),
    vendors: template.vendors.map(([name, priority, share, tip]) => ({
      name,
      priority,
      estimatedCostInr: Math.round(request.budgetInr * share),
      tip,
    })),
    ideas: template.ideas.map(([title, description]) => ({ title, description })),
  };
}
