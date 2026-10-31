import { z } from "zod";
import { EVENT_TYPES, type EventType } from "../shared/schema";
import { planIdSchema } from "./routes";

export interface PlanQuery {
  /** From "/plan?type=wedding": which event type to preselect. */
  type?: EventType;
  /** From "/plan?edit=<id>": which saved plan to edit. */
  edit?: string;
}

/** Reads the query string of the new-plan page. Anything unexpected is ignored. */
export function parsePlanQuery(search: string): PlanQuery {
  const params = new URLSearchParams(search);
  const type = z.enum(EVENT_TYPES).safeParse(params.get("type"));
  const edit = planIdSchema.safeParse(params.get("edit"));
  return {
    ...(type.success ? { type: type.data } : {}),
    ...(edit.success ? { edit: edit.data } : {}),
  };
}
