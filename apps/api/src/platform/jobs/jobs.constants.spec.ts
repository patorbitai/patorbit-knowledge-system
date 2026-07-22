import { describe, expect, it } from "vitest";
import { getJobQueueToken, JOB_QUEUES } from "./jobs.constants";

describe("JobsConstants", () => {
  describe("getJobQueueToken", () => {
    it("wraps the name in a JOB_QUEUE: prefix", () => {
      expect(getJobQueueToken("default")).toBe("JOB_QUEUE:default");
      expect(getJobQueueToken("email")).toBe("JOB_QUEUE:email");
    });
  });

  describe("JOB_QUEUES", () => {
    it("is a Symbol for DI", () => {
      expect(JOB_QUEUES.toString()).toBe("Symbol(JOB_QUEUES)");
    });
  });
});
