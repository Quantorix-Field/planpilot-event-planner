import { handlePlanRequest } from "../server/handler.js";

export function POST(request: Request): Promise<Response> {
  return handlePlanRequest(request);
}
