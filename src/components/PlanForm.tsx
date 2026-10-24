import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  todayIst,
  type PlanRequest,
} from "../../shared/schema";
import {
  EMPTY_VALUES,
  FIELD_ORDER,
  parseForm,
  valuesFromRequest,
  type FieldName,
  type FormErrors,
  type FormValues,
} from "../formUtils";

interface PlanFormProps {
  initial: PlanRequest | null;
  busy: boolean;
  serverErrors: FormErrors;
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

export function PlanForm({ initial, busy, serverErrors, onSubmit }: PlanFormProps) {
  const [values, setValues] = useState<FormValues>(
    initial ? valuesFromRequest(initial) : EMPTY_VALUES,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const refs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({});

  useEffect(() => {
    setErrors(serverErrors);
  }, [serverErrors]);

  function setField<K extends FieldName>(name: K, value: FormValues[K]) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => {
      if (!previous[name]) return previous;
      const { [name]: _removed, ...rest } = previous;
      return rest;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      const first = FIELD_ORDER.find((field) => result.errors[field]);
      if (first) refs.current[first]?.focus();
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  const typeErrorId = errors.eventType ? "eventType-error" : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
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

        <Field
          name="vibe"
          label="Anything special? (optional)"
          hint="Theme, traditions, food preferences, must-haves. Up to 500 characters."
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
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Planning…" : "Create my plan"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
