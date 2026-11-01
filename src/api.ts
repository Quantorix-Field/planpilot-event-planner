import { z } from "zod";
import {
  planResponseSchema,
  type PlanRequest,
  type PlanResponse,
} from "../shared/schema";

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[] | undefined>;
  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[] | undefined> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Thrown when the visitor stops the request. This is not an error to show. */
export class RequestCancelled extends Error {
  constructor() {
    super("The request was stopped.");
    this.name = "RequestCancelled";
  }
}

const errorBodySchema = z.object({
  error: z.string(),
  fieldErrors: z.record(z.array(z.string()).optional()).optional(),
});

/** Sends the form input to our serverless proxy and returns a validated plan. */
export async function requestPlan(
  input: PlanRequest,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 65_000,
  signal?: AbortSignal,
): Promise<PlanResponse> {
  const timeout = AbortSignal.timeout(timeoutMs);
  let response: Response;
  try {
    response = await fetchImpl("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch {
    if (signal?.aborted) throw new RequestCancelled();
    throw new ApiError(
      "Couldn't reach the server. Check your connection and try again.",
      0,
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = undefined;
  }
  if (signal?.aborted) throw new RequestCancelled();

  if (!response.ok) {
    const parsed = errorBodySchema.safeParse(data);
    if (parsed.success) {
      throw new ApiError(
        parsed.data.error,
        response.status,
        parsed.data.fieldErrors,
      );
    }
    throw new ApiError("Something went wrong. Please try again.", response.status);
  }

  const plan = planResponseSchema.safeParse(data);
  if (!plan.success) {
    throw new ApiError("The server sent an unexpected response.", 502);
  }
  return plan.data;
}
