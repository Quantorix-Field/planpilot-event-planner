import {
  planRequestSchema,
  type EventType,
  type PlanRequest,
} from "../shared/schema";

export interface FormValues {
  eventType: EventType | "";
  eventDate: string;
  guestCount: string;
  budgetInr: string;
  city: string;
  vibe: string;
}

export type FieldName = keyof FormValues;
export type FormErrors = Partial<Record<FieldName, string>>;

/** Order used to decide which invalid field gets focus first. */
export const FIELD_ORDER: readonly FieldName[] = [
  "eventType",
  "eventDate",
  "guestCount",
  "budgetInr",
  "city",
  "vibe",
];

export const EMPTY_VALUES: FormValues = {
  eventType: "",
  eventDate: "",
  guestCount: "",
  budgetInr: "",
  city: "",
  vibe: "",
};

export function valuesFromRequest(request: PlanRequest): FormValues {
  return {
    eventType: request.eventType,
    eventDate: request.eventDate,
    guestCount: String(request.guestCount),
    budgetInr: String(request.budgetInr),
    city: request.city,
    vibe: request.vibe,
  };
}

function isFieldName(value: unknown): value is FieldName {
  return typeof value === "string" && (FIELD_ORDER as readonly string[]).includes(value);
}

/** Empty text becomes NaN so the schema reports "Enter ..." instead of treating it as 0. */
function toNumber(text: string): number {
  return text.trim() === "" ? Number.NaN : Number(text);
}

export type ParseResult =
  | { ok: true; data: PlanRequest }
  | { ok: false; errors: FormErrors };

/** Turns the raw form strings into a validated request, or one message per bad field. */
export function parseForm(values: FormValues): ParseResult {
  const result = planRequestSchema.safeParse({
    eventType: values.eventType === "" ? undefined : values.eventType,
    eventDate: values.eventDate,
    guestCount: toNumber(values.guestCount),
    budgetInr: toNumber(values.budgetInr),
    city: values.city,
    vibe: values.vibe,
  });
  if (result.success) return { ok: true, data: result.data };

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (isFieldName(field) && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

/** Maps field errors returned by the server onto form fields (first message each). */
export function serverErrorsToForm(
  fieldErrors: Record<string, string[] | undefined>,
): FormErrors {
  const errors: FormErrors = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const first = messages?.[0];
    if (isFieldName(field) && first) errors[field] = first;
  }
  return errors;
}
