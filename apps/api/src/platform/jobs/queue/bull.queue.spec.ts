import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  worker: vi.fn(),
}));

vi.mock("bullmq", () => ({
  Worker: mocks.worker,
}));

import { BullMQQueue } from "./bull.queue";

describe("BullMQQueue", () => {
  const connection = { host: "mocked", port: 6379 };
  let bull: ReturnType<typeof createFakeBull>;
  let queue: BullMQQueue;

  function createFakeBull() {
    return {
      name: "test-queue",
      opts: { connection },
      add: vi.fn(),
      getJob: vi.fn(),
    };
  }

  beforeEach(() => {
    bull = createFakeBull();
    queue = new BullMQQueue(bull as any);
  });

  it("adapts add to BullMQ#add with the abstract JobOptions", async () => {
    bull.add.mockResolvedValue({
      id: "b1",
      name: "work",
      data: { value: 1 },
      opts: { attempts: 3, delay: 50 },
      attemptsMade: 0,
      failedReason: null,
    });

    await expect(
      queue.add("work", { value: 1 }, { attempts: 3, delay: 50 }),
    ).resolves.toMatchObject({
      id: "b1",
      name: "work",
      data: { value: 1 },
      status: "unknown",
    });

    expect(bull.add).toHaveBeenCalledWith("work", { value: 1 }, {
      attempts: 3,
      delay: 50,
      repeat: undefined,
      backoff: undefined,
      removeOnComplete: undefined,
      removeOnFail: undefined,
    });
  });

  it("forwards BullMQ job lifetime to the abstract getJobStatus", async () => {
    const job = {
      id: "b2",
      name: "work",
      data: { value: 2 },
      opts: {},
      attemptsMade: 0,
      failedReason: null,
      getState: vi.fn().mockResolvedValue("completed"),
    };

    bull.getJob.mockResolvedValue(job);

    await expect(queue.getJobStatus("b2")).resolves.toBe("completed");
  });

  it("returns unknown when BullMQ cannot find the job for status", async () => {
    bull.getJob.mockResolvedValue(null);
    await expect(queue.getJobStatus("missing")).resolves.toBe("unknown");
  });
});
