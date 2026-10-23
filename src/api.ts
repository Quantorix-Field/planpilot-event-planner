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

const errorBodySchema = z.object({
  error: z.string(),
  fieldErrors: z.record(z.array(z.string()).optional()).optional(),
});

/** Sends the form input to our serverless proxy and returns a validated plan. */
export async function requestPlan(
  input: PlanRequest,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 65_000,
): Promise<PlanResponse> {
  let response: Response;
  try {
    response = await fetchImpl("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
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
