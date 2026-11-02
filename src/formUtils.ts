import { pickAllowed, STYLES, traditionsFor } from "../shared/formOptions";
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
  traditions: string[];
  food: string;
  styles: string[];
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
  "traditions",
  "food",
  "styles",
  "vibe",
];

/** The form has two steps: the first five fields are step 1, everything else is step 2. */
export type FormStep = 1 | 2;
const STEP_ONE_FIELDS: readonly FieldName[] = FIELD_ORDER.slice(0, 5);

export function fieldStep(field: FieldName): FormStep {
  return STEP_ONE_FIELDS.includes(field) ? 1 : 2;
}

/** The first field, in form order, that has an error message. */
export function firstErrorField(errors: FormErrors): FieldName | undefined {
  return FIELD_ORDER.find((field) => errors[field]);
}

export const EMPTY_VALUES: FormValues = {
  eventType: "",
  eventDate: "",
  guestCount: "",
  budgetInr: "",
  city: "",
  traditions: [],
  food: "",
  styles: [],
  vibe: "",
};

export function valuesFromRequest(request: PlanRequest): FormValues {
  return {
    eventType: request.eventType,
    eventDate: request.eventDate,
    guestCount: String(request.guestCount),
    budgetInr: String(request.budgetInr),
    city: request.city,
    traditions: [...(request.traditions ?? [])],
    food: request.food ?? "",
    styles: [...(request.styles ?? [])],
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
  // Traditions depend on the event type, so a choice left over from another type is dropped.
  const traditions = pickAllowed(values.traditions, traditionsFor(values.eventType));
  const styles = pickAllowed(values.styles, STYLES);
  const result = planRequestSchema.safeParse({
    eventType: values.eventType === "" ? undefined : values.eventType,
    eventDate: values.eventDate,
    guestCount: toNumber(values.guestCount),
    budgetInr: toNumber(values.budgetInr),
    city: values.city,
    vibe: values.vibe,
    ...(traditions.length > 0 ? { traditions } : {}),
    ...(values.food !== "" ? { food: values.food } : {}),
    ...(styles.length > 0 ? { styles } : {}),
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
