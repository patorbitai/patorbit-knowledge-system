import  { type ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RateLimitGuard } from "./rate-limit.guard";

describe("RateLimitGuard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delegates request evaluation to ThrottlerGuard", async () => {
    const context = {} as ExecutionContext;
    const parentHandler = vi
      .spyOn(ThrottlerGuard.prototype as unknown as { handleRequest: (...args: unknown[]) => Promise<boolean> }, "handleRequest")
      .mockResolvedValue(true);
    const guard = Object.create(RateLimitGuard.prototype) as RateLimitGuard;

    const allowed = await (
      guard as unknown as {
        handleRequest: (context: ExecutionContext, limit: number, ttl: number) => Promise<boolean>;
      }
    ).handleRequest(context, 5, 60_000);

    expect(allowed).toBe(true);
    expect(parentHandler).toHaveBeenCalledOnce();
    expect(parentHandler).toHaveBeenCalledWith(context, 5, 60_000);
  });

  it("returns a rejected decision from ThrottlerGuard", async () => {
    vi.spyOn(ThrottlerGuard.prototype as unknown as { handleRequest: (...args: unknown[]) => Promise<boolean> }, "handleRequest")
      .mockResolvedValue(false);
    const guard = Object.create(RateLimitGuard.prototype) as RateLimitGuard;

    await expect(
      (
        guard as unknown as {
          handleRequest: (context: ExecutionContext, limit: number, ttl: number) => Promise<boolean>;
        }
      ).handleRequest({} as ExecutionContext, 1, 1_000),
    ).resolves.toBe(false);
  });
});
