import { describe, expect, it } from "vitest";
import { ApiError, RequestCancelled, requestPlan } from "../src/api";
import { makePlanResponse, makeRequest } from "./fixtures";

/** A fetch that never answers, and rejects when its signal aborts (like the real one). */
const hanging = ((_url: string, init: RequestInit) =>
  new Promise((_resolve, reject) => {
    const signal = init.signal;
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    signal?.addEventListener("abort", () => reject(signal.reason));
  })) as unknown as typeof fetch;

const answering = (async () =>
  new Response(JSON.stringify(makePlanResponse()), { status: 200 })) as unknown as typeof fetch;

describe("stopping a plan request", () => {
  it("throws RequestCancelled when the visitor stops it", async () => {
    const keepAlive = setTimeout(() => undefined, 3000);
    const controller = new AbortController();
    const pending = requestPlan(makeRequest(), hanging, 5000, controller.signal);
    controller.abort();
    const error = await pending.then(
      () => null,
      (caught: unknown) => caught,
    );
    clearTimeout(keepAlive);
    expect(error).toBeInstanceOf(RequestCancelled);
  });

  it("throws RequestCancelled when it was already stopped before sending", async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await requestPlan(makeRequest(), hanging, 5000, controller.signal).then(
      () => null,
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(RequestCancelled);
  });

  it("still reports a timeout as a normal error when the visitor did not stop it", async () => {
    const keepAlive = setTimeout(() => undefined, 3000);
    const controller = new AbortController();
    const error = await requestPlan(makeRequest(), hanging, 40, controller.signal).then(
      () => null,
      (caught: unknown) => caught,
    );
    clearTimeout(keepAlive);
    expect(error).toBeInstanceOf(ApiError);
    expect(error instanceof RequestCancelled).toBe(false);
  });

  it("returns the plan normally when it is never stopped", async () => {
    const controller = new AbortController();
    const plan = await requestPlan(makeRequest(), answering, 5000, controller.signal);
    expect(plan).toEqual(makePlanResponse());
  });
});
