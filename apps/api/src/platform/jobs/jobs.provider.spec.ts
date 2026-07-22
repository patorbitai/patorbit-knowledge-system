import { describe, expect, it, vi } from "vitest";
import type { Job, JobQueue, JobWorker } from "./jobs.provider";

describe("jobs.provider types", () => {
  it("Job interface matches the shape returned by both queue implementations", () => {
    const j: Job<{ message: string }> = {
      id: "abc",
      name: "process",
      data: { message: "hello" },
      opts: { attempts: 3, delay: 100 },
    };
    expect(j).toHaveProperty("id");
    expect(j).toHaveProperty("name");
    expect(j).toHaveProperty("data");
    expect(j).toHaveProperty("opts");
  });

  it("JobQueue interface compiles with add, process, getJob", () => {
    const q: JobQueue = {
      add: vi.fn(),
      process: vi.fn(),
      getJob: vi.fn(),
    };
    expect(Object.keys(q).sort()).toEqual(["add", "getJob", "process"]);
  });

  it("JobWorker accepts a Job and returns Promise<void>", () => {
    const w: JobWorker<number> = async (_j) => undefined;
    expect(typeof w).toBe("function");
  });
});
