import { beforeEach, describe, expect, it, vi } from "vitest";
import { JOB_QUEUES } from "./jobs.constants";
import { JobsService } from "./jobs.service";
import type { JobQueue } from "./jobs.provider";

describe("JobsService", () => {
  let queues: Map<string, JobQueue>;
  let service: JobsService;
  let defaultQueue: JobQueue;

  beforeEach(() => {
    queues = new Map();
    defaultQueue = {
      name: "default",
      add: vi.fn(),
      getJob: vi.fn(),
      getJobStatus: vi.fn(),
      process: vi.fn(),
    };
    queues.set("default", defaultQueue);
    service = new JobsService(queues);
  });

  it("adds a job to the named queue", async () => {
    await service.add("default", "work", { value: 1 });
    expect(defaultQueue.add).toHaveBeenCalledWith("work", { value: 1 }, undefined);
  });

  it("adds a job to the default queue via addJob", async () => {
    await service.addJob("work", { value: 1 });
    expect(defaultQueue.add).toHaveBeenCalledWith("work", { value: 1 }, undefined);
  });

  it("looks up a job from the named queue", async () => {
    await service.getJob("default", "job-1");
    expect(defaultQueue.getJob).toHaveBeenCalledWith("job-1");
  });

  it("looks up job status from the named queue", async () => {
    await service.getJobStatus("default", "job-1");
    expect(defaultQueue.getJobStatus).toHaveBeenCalledWith("job-1");
  });

  it("registers a worker on the named queue", () => {
    const handler = async () => {};
    service.process("default", handler);
    expect(defaultQueue.process).toHaveBeenCalledWith(handler, undefined);
  });

  it("schedules a delayed job on the named queue", async () => {
    await service.schedule("default", "work", { value: 1 }, 500);
    expect(defaultQueue.add).toHaveBeenCalledWith("work", { value: 1 }, { delay: 500 });
  });

  it("schedules a repeating job on the named queue", async () => {
    await service.repeat("default", "work", { value: 1 }, { every: 1000 });
    expect(defaultQueue.add).toHaveBeenCalledWith("work", { value: 1 }, { repeat: { every: 1000 } });
  });

  it("throws when a queue is not registered", () => {
    expect(() => service.getQueue("missing")).toThrow('Job queue "missing" is not registered');
  });
});
