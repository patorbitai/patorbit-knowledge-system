import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InMemoryQueue } from "./in-memory.queue";

describe("InMemoryQueue", () => {
  let queue: InMemoryQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    queue = new InMemoryQueue("test");
    queue.onModuleInit();
  });

  afterEach(() => {
    (queue as any).processing = false;
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it("enqueues a job, which is then available via getJob", async () => {
    const job = await queue.add("work", { value: 1 });
    await expect(queue.getJob(job.id)).resolves.toEqual(expect.objectContaining({ id: job.id, status: "waiting" }));
  });

  it("processes a job with a worker", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    queue.process(handler);
    const job = await queue.add("work", { value: 1 });

    await vi.advanceTimersByTimeAsync(1000);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: job.id }));
    await expect(queue.getJobStatus(job.id)).resolves.toBe("completed");
  });

  it("retries a failed job", async () => {
    const handler = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue(undefined);
    queue.process(handler);

    const job = await queue.add("work", { value: 1 }, { attempts: 2 });

    await vi.advanceTimersByTimeAsync(1000); // First attempt: fails, backoff scheduled
    await expect(queue.getJobStatus(job.id)).resolves.toBe("failed");

    await vi.advanceTimersByTimeAsync(3000); // Backoff fires, retry picked up and succeeds
    await expect(queue.getJobStatus(job.id)).resolves.toBe("completed");
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
