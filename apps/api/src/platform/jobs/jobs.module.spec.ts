import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getJobQueueToken, JOB_QUEUES } from "./jobs.constants";
import { JobsModule } from "./jobs.module";
import { JobsService } from "./jobs.service";

describe("JobsModule", () => {
  let moduleRef;

  afterEach(async () => {
    await moduleRef?.close();
  });

  it("compiles with a default in-memory queue", async () => {
    moduleRef = await vi.importActual("@nestjs/testing").then(
      async (testing) => {
        return testing.Test.createTestingModule({
          imports: [JobsModule.forRoot()],
        }).compile();
      },
    );

    expect(moduleRef.get(JobsService)).toBeInstanceOf(JobsService);
    expect(moduleRef.get(JOB_QUEUES)).toBeInstanceOf(Map);
    expect(moduleRef.get(getJobQueueToken("default"))).toBeDefined();
  });

  it("compiles with a named in-memory queue", async () => {
    moduleRef = await vi.importActual("@nestjs/testing").then(
      async (testing) => {
        return testing.Test.createTestingModule({
          imports: [JobsModule.forRoot({ queues: [{ name: "email" }] })],
        }).compile();
      },
    );

    const queue = moduleRef.get(getJobQueueToken("email"));
    expect(queue.name).toBe("email");
  });
});
