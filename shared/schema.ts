import { z } from "zod";

export const EVENT_TYPES = ["wedding", "birthday", "community"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: "Wedding",
  birthday: "Birthday",
  community: "Community event",
};

/** Today's calendar date (YYYY-MM-DD) in India Standard Time. */
export function todayIst(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** True only for real calendar dates written as YYYY-MM-DD. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** What the user types into the form. This is the single input for the app. */
export const planRequestSchema = z.object({
  eventType: z.enum(EVENT_TYPES, {
    errorMap: () => ({ message: "Choose an event type." }),
  }),
  eventDate: z
    .string()
    .refine(isValidIsoDate, "Enter a valid date.")
    .refine((v) => v >= todayIst(), "The date can't be in the past."),
  guestCount: z
    .number({ invalid_type_error: "Enter the number of guests." })
    .int("Guests must be a whole number.")
    .min(1, "At least 1 guest.")
    .max(5000, "Maximum 5,000 guests."),
  budgetInr: z
    .number({ invalid_type_error: "Enter your budget in rupees." })
    .int("Budget must be a whole number.")
    .min(5000, "Minimum budget is ₹5,000.")
    .max(100_000_000, "Maximum budget is ₹10 crore."),
  city: z
    .string()
    .trim()
    .min(2, "Enter a city.")
    .max(60, "City name is too long."),
  vibe: z.string().trim().max(500, "Keep notes under 500 characters.").default(""),
});
export type PlanRequest = z.infer<typeof planRequestSchema>;

/** What Gemini must return. Rupee amounts are computed by our code, not the AI. */
export const aiPlanSchema = z.object({
  summary: z.string().trim().min(1).max(400),
  budget: z
    .array(
      z.object({
        category: z.string().trim().min(1).max(60),
        percent: z.number().min(0).max(100),
        note: z.string().trim().min(1).max(200),
      }),
    )
    .min(4)
    .max(12),
  timeline: z
    .array(
      z.object({
        daysBefore: z.number().int().min(0).max(1100),
        task: z.string().trim().min(1).max(200),
      }),
    )
    .min(5)
    .max(25),
  vendors: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        priority: z.enum(["must-book", "recommended", "optional"]),
        estimatedCostInr: z.number().int().min(0).max(100_000_000),
        tip: z.string().trim().min(1).max(200),
      }),
    )
    .min(4)
    .max(15),
  ideas: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        description: z.string().trim().min(1).max(300),
      }),
    )
    .min(3)
    .max(8),
});
export type AiPlan = z.infer<typeof aiPlanSchema>;

/** What the API returns to the browser after our code finalizes the AI output. */
export const planResponseSchema = z.object({
  summary: z.string(),
  daysUntilEvent: z.number().int().min(0),
  budget: z.array(
    z.object({
      category: z.string(),
      percent: z.number(),
      amountInr: z.number().int().min(0),
      note: z.string(),
    }),
  ),
  timeline: z.array(
    z.object({
      dueDate: z.string(),
      daysBefore: z.number().int().min(0),
      task: z.string(),
    }),
  ),
  vendors: aiPlanSchema.shape.vendors,
  ideas: aiPlanSchema.shape.ideas,
});
export type PlanResponse = z.infer<typeof planResponseSchema>;
