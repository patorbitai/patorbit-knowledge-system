
import { beforeEach,describe, expect, it, vi } from "vitest";

import { RetryService } from "./retry.service";

describe("RetryService", () => {
  let service: RetryService;

  beforeEach(() => {
    service = new RetryService();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should execute a function successfully on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await service.execute(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and eventually succeed", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Attempt 1 failed"))
      .mockRejectedValueOnce(new Error("Attempt 2 failed"))
      .mockResolvedValue("success on attempt 3");

    const result = await service.execute(fn, { maxRetries: 3, backoff: "fixed", delay: 10 });
    expect(result).toBe("success on attempt 3");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should throw after exhausting all retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Always fails"));

    await expect(service.execute(fn, { maxRetries: 2, delay: 10, backoff: "fixed" })).rejects.toThrow(
      "Always fails",
    );
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should use default options when none are provided", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await service.execute(fn);
    expect(result).toBe("ok");
  });

  it("should execute with callback on retry", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValue("finally ok");

    const onRetry = vi.fn();

    const result = await service.executeWithCallback(fn, onRetry, {
      maxRetries: 3,
      delay: 10,
      backoff: "fixed",
    });

    expect(result).toBe("finally ok");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error));
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error));
  });

  it("should invoke onRetry with the correct error", async () => {
    const testError = new Error("Specific error");
    const fn = vi.fn().mockRejectedValueOnce(testError).mockResolvedValue("ok");
    const onRetry = vi.fn();

    await service.executeWithCallback(fn, onRetry, {
      maxRetries: 2,
      delay: 10,
      backoff: "fixed",
    });

    expect(onRetry).toHaveBeenCalledWith(1, testError);
  });

  it("should use exponential backoff for calculateDelay", async () => {
    // We test via a spy-wrapped scenario.
    // With delay=100, maxRetries=3, backoff="exponential":
    //   attempt 1 -> delay * 2^(1-1) = 100
    //   attempt 2 -> delay * 2^(2-1) = 200
    //   attempt 3 -> delay * 2^(3-1) = 400
    let attemptCount = 0;
    const startTime = Date.now();

    await service.execute(
      async () => {
        attemptCount++;
        if (attemptCount < 3) throw new Error("fail");
        return "ok";
      },
      { maxRetries: 3, delay: 100, backoff: "exponential" },
    );

    expect(attemptCount).toBe(3);
    // Ensure some time passed
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(100);
  });

  it("should use linear backoff", async () => {
    let attemptCount = 0;
    const startTime = Date.now();

    await service.execute(
      async () => {
        attemptCount++;
        if (attemptCount < 3) throw new Error("fail");
        return "ok";
      },
      { maxRetries: 3, delay: 100, backoff: "linear" },
    );

    expect(attemptCount).toBe(3);
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(100);
  });

  it("should use fixed backoff", async () => {
    let attemptCount = 0;
    const startTime = Date.now();

    await service.execute(
      async () => {
        attemptCount++;
        if (attemptCount < 3) throw new Error("fail");
        return "ok";
      },
      { maxRetries: 3, delay: 50, backoff: "fixed" },
    );

    expect(attemptCount).toBe(3);
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(50);
  });

  it("should throw the last error when all retries are exhausted", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Error 1"))
      .mockRejectedValueOnce(new Error("Error 2"))
      .mockRejectedValueOnce(new Error("Error 3"));

    await expect(service.execute(fn, { maxRetries: 3, delay: 10, backoff: "fixed" })).rejects.toThrow(
      "Error 3",
    );
  });
});
