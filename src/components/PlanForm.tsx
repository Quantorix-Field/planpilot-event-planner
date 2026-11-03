import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  FOOD_PREFERENCES,
  MAX_STYLES,
  MAX_TRADITIONS,
  STYLES,
  pickAllowed,
  toggleChoice,
  traditionsFor,
} from "../../shared/formOptions";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  todayIst,
  type EventType,
  type PlanRequest,
} from "../../shared/schema";
import {
  EMPTY_VALUES,
  fieldStep,
  firstErrorField,
  parseForm,
  valuesFromRequest,
  type FieldName,
  type FormErrors,
  type FormStep,
  type FormValues,
} from "../formUtils";

interface PlanFormProps {
  initial: PlanRequest | null;
  /** Event type to preselect on a blank form (used by "/plan?type=wedding"). */
  initialType?: EventType;
  /** Text of the submit button. */
  submitLabel?: string;
  busy: boolean;
  serverErrors: FormErrors;
  /** Raise this number to bring the visitor back to the first field. */
  focusSignal?: number;
  onSubmit: (request: PlanRequest) => void;
}

interface ControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean;
}

interface FieldProps {
  name: FieldName;
  label: string;
  hint?: string;
  error: string | undefined;
  className?: string;
  children: (control: ControlProps) => ReactNode;
}

function Field({ name, label, hint, error, className, children }: FieldProps) {
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ");
  return (
    <div className={`field ${className ?? ""}`}>
      <label htmlFor={name}>{label}</label>
      {children({
        id: name,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": Boolean(error),
      })}
      {hint ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface ChipGroupProps {
  name: "traditions" | "food" | "styles";
  legend: string;
  hint: string;
  error: string | undefined;
  children: ReactNode;
}

/** A fieldset of chips: the legend names the group and the hint and error are read with it. */
function ChipGroup({ name, legend, hint, error, children }: ChipGroupProps) {
  const describedBy = [`${name}-hint`, error ? `${name}-error` : ""].filter(Boolean).join(" ");
  return (
    <fieldset className="field full" aria-describedby={describedBy}>
      <legend>{legend}</legend>
      <p id={`${name}-hint`} className="field-hint">
        {hint}
      </p>
      <div className="chips">{children}</div>
      {error ? (
        <p id={`${name}-error`} className="field-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

const STEP_TITLES: Record<FormStep, string> = { 1: "Basics", 2: "Style and traditions" };

type FocusTarget = FieldName | "heading";

export function PlanForm({
  initial,
  initialType,
  submitLabel = "Create my plan",
  busy,
  serverErrors,
  focusSignal = 0,
  onSubmit,
}: PlanFormProps) {
  const [values, setValues] = useState<FormValues>(
    initial ? valuesFromRequest(initial) : { ...EMPTY_VALUES, eventType: initialType ?? "" },
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState<FormStep>(1);
  const [focusTick, setFocusTick] = useState(0);
  const refs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({});
  const headings = useRef<Partial<Record<FormStep, HTMLElement | null>>>({});
  const pendingFocus = useRef<FocusTarget | null>(null);

  /** Shows a step and puts focus on a field (or the step heading) once it is on screen. */
  const moveTo = useCallback((nextStep: FormStep, target: FocusTarget) => {
    pendingFocus.current = target;
    setStep(nextStep);
    setFocusTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    const element = target === "heading" ? headings.current[step] : refs.current[target];
    element?.focus();
  }, [step, focusTick]);

  useEffect(() => {
    setErrors(serverErrors);
    const first = firstErrorField(serverErrors);
    if (first) moveTo(fieldStep(first), first);
  }, [serverErrors, moveTo]);

  useEffect(() => {
    if (focusSignal > 0) moveTo(1, "eventDate");
  }, [focusSignal, moveTo]);

  function clearError(name: FieldName) {
    setErrors((previous) => {
      if (!previous[name]) return previous;
      const { [name]: _removed, ...rest } = previous;
      return rest;
    });
  }

  function setField<K extends FieldName>(name: K, value: FormValues[K]) {
    setValues((previous) => {
      const next = { ...previous, [name]: value };
      // Traditions belong to one event type, so changing the type drops the ones that no longer fit.
      return name === "eventType"
        ? { ...next, traditions: pickAllowed(next.traditions, traditionsFor(next.eventType)) }
        : next;
    });
    clearError(name);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      const first = firstErrorField(result.errors);
      if (first) moveTo(fieldStep(first), first);
      return;
    }
    setErrors({});
    if (step === 1) {
      moveTo(2, "heading");
      return;
    }
    onSubmit(result.data);
  }

  const typeErrorId = errors.eventType ? "eventType-error" : undefined;
  const typeTraditions = traditionsFor(values.eventType);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ol className="form-steps no-print" aria-label="Form progress">
        {([1, 2] as const).map((number) => (
          <li key={number} aria-current={step === number ? "step" : undefined}>
            <span className="form-step-num" aria-hidden="true">
              {number}
            </span>
            <span>
              <span className="sr-only">Step {number} of 2: </span>
              {STEP_TITLES[number]}
            </span>
          </li>
        ))}
      </ol>

      <div className="form-grid" hidden={step !== 1}>
        <h3
          className="step-heading full"
          tabIndex={-1}
          ref={(element: HTMLHeadingElement | null) => {
            headings.current[1] = element;
          }}
        >
          Step 1 of 2: Basics
        </h3>

        <fieldset className="field full" aria-describedby={typeErrorId}>
          <legend>Event type</legend>
          <div className="choices">
            {EVENT_TYPES.map((type, index) => (
              <label className="choice" key={type}>
                <input
                  type="radio"
                  name="eventType"
                  value={type}
                  checked={values.eventType === type}
                  onChange={() => setField("eventType", type)}
                  ref={(element: HTMLInputElement | null) => {
                    if (index === 0) refs.current.eventType = element;
                  }}
                />
                <span>{EVENT_TYPE_LABELS[type]}</span>
              </label>
            ))}
          </div>
          {errors.eventType ? (
            <p id="eventType-error" className="field-error">
              {errors.eventType}
            </p>
          ) : null}
        </fieldset>

        <Field name="eventDate" label="Event date" error={errors.eventDate}>
          {(control) => (
            <input
              {...control}
              type="date"
              required
              min={todayIst()}
              value={values.eventDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setField("eventDate", e.target.value)}
              ref={(element: HTMLInputElement | null) => {
                refs.current.eventDate = element;
              }}
            />
          )}
        </Field>

        <Field name="guestCount" label="Number of guests" error={errors.guestCount}>
          {(control) => (
            <input
              {...control}
              type="number"
              inputMode="numeric"
              min={1}
              max={5000}
              required
              placeholder="e.g. 150"
              value={values.guestCount}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setField("guestCount", e.target.value)}
              ref={(element: HTMLInputElement | null) => {
                refs.current.guestCount = element;
              }}
            />
          )}
        </Field>

        <Field
          name="budgetInr"
          label="Total budget (₹)"
          hint="Your overall spend in rupees."
          error={errors.budgetInr}
        >
          {(control) => (
            <input
              {...control}
              type="number"
              inputMode="numeric"
              min={5000}
              required
              placeholder="e.g. 1500000"
              value={values.budgetInr}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setField("budgetInr", e.target.value)}
              ref={(element: HTMLInputElement | null) => {
                refs.current.budgetInr = element;
              }}
            />
          )}
        </Field>

        <Field name="city" label="City" error={errors.city}>
          {(control) => (
            <input
              {...control}
              type="text"
              autoComplete="address-level2"
              required
              maxLength={60}
              placeholder="e.g. Jaipur"
              value={values.city}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setField("city", e.target.value)}
              ref={(element: HTMLInputElement | null) => {
                refs.current.city = element;
              }}
            />
          )}
        </Field>

        <div className="field full">
          <div className="btn-row">
            <button type="submit" className="btn btn-primary">
              Next: style and traditions
            </button>
          </div>
        </div>
      </div>

      <div className="form-grid" hidden={step !== 2}>
        <h3
          className="step-heading full"
          tabIndex={-1}
          ref={(element: HTMLHeadingElement | null) => {
            headings.current[2] = element;
          }}
        >
          Step 2 of 2: Style and traditions
        </h3>

        <ChipGroup
          name="traditions"
          legend="Traditions and functions (optional)"
          hint={
            typeTraditions.length > 0
              ? `Pick up to ${MAX_TRADITIONS}. ${values.traditions.length} chosen.`
              : "Choose an event type in step 1 to see the options."
          }
          error={errors.traditions}
        >
          {typeTraditions.map((option, index) => {
            const checked = values.traditions.includes(option);
            return (
              <label className="choice" key={option}>
                <input
                  type="checkbox"
                  name="traditions"
                  value={option}
                  checked={checked}
                  disabled={!checked && values.traditions.length >= MAX_TRADITIONS}
                  onChange={() =>
                    setField("traditions", toggleChoice(values.traditions, option, MAX_TRADITIONS))
                  }
                  ref={(element: HTMLInputElement | null) => {
                    if (index === 0) refs.current.traditions = element;
                  }}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </ChipGroup>

        <ChipGroup
          name="food"
          legend="Food preference (optional)"
          hint="Shapes the catering plan and vendor choices."
          error={errors.food}
        >
          {["", ...FOOD_PREFERENCES].map((option, index) => (
            <label className="choice" key={option || "none"}>
              <input
                type="radio"
                name="food"
                value={option}
                checked={values.food === option}
                onChange={() => setField("food", option)}
                ref={(element: HTMLInputElement | null) => {
                  if (index === 0) refs.current.food = element;
                }}
              />
              <span>{option || "No preference"}</span>
            </label>
          ))}
        </ChipGroup>

        <ChipGroup
          name="styles"
          legend="Style and mood (optional)"
          hint={`Pick up to ${MAX_STYLES}. ${values.styles.length} chosen.`}
          error={errors.styles}
        >
          {STYLES.map((option, index) => {
            const checked = values.styles.includes(option);
            return (
              <label className="choice" key={option}>
                <input
                  type="checkbox"
                  name="styles"
                  value={option}
                  checked={checked}
                  disabled={!checked && values.styles.length >= MAX_STYLES}
                  onChange={() => setField("styles", toggleChoice(values.styles, option, MAX_STYLES))}
                  ref={(element: HTMLInputElement | null) => {
                    if (index === 0) refs.current.styles = element;
                  }}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </ChipGroup>

        <Field
          name="vibe"
          label="Anything special? (optional)"
          hint="Theme, must-haves, family wishes. Up to 500 characters."
          error={errors.vibe}
          className="full"
        >
          {(control) => (
            <textarea
              {...control}
              maxLength={500}
              value={values.vibe}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setField("vibe", e.target.value)}
              ref={(element: HTMLTextAreaElement | null) => {
                refs.current.vibe = element;
              }}
            />
          )}
        </Field>

        <div className="field full">
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => moveTo(1, "heading")}
            >
              Back to basics
            </button>
            <button id="plan-submit" type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Planning…" : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
