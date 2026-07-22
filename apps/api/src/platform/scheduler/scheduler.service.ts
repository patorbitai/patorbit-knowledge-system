import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";

import { SCHEDULER_PROVIDER } from "./scheduler.constants";
import  { type SchedulerJob,type SchedulerProvider } from "./scheduler.provider";

@Injectable()
export class SchedulerService implements OnModuleDestroy {
  constructor(
    @Inject(SCHEDULER_PROVIDER)
    private readonly provider: SchedulerProvider
  ) {}

  get providerName(): string {
    return this.provider.name;
  }

  async schedule(job: SchedulerJob): Promise<void> {
    return this.provider.schedule(job);
  }

  async cancel(jobId: string): Promise<void> {
    return this.provider.cancel(jobId);
  }

  async cancelAll(): Promise<void> {
    return this.provider.cancelAll();
  }

  async listJobs(): Promise<SchedulerJob[]> {
    return this.provider.listJobs();
  }

  async getJob(jobId: string): Promise<SchedulerJob | null> {
    return this.provider.getJob(jobId);
  }

  async onModuleDestroy(): Promise<void> {
    await this.cancelAll();
  }
}
