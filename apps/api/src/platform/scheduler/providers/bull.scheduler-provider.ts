import { Injectable, Logger } from "@nestjs/common";

import  { type SchedulerJob, type SchedulerProvider } from "../scheduler.provider";

export interface BullSchedulerConfig {
  queueName?: string;
}

@Injectable()
export class BullSchedulerProvider implements SchedulerProvider {
  private readonly logger = new Logger(BullSchedulerProvider.name);
  readonly name = "bull";

  async schedule(job: SchedulerJob): Promise<void> {
    this.logger.log(`[Bull] Scheduled ${job.type} job: ${job.name} (${job.id})`);
  }

  async cancel(jobId: string): Promise<void> {
    this.logger.log(`[Bull] Cancelled job: ${jobId}`);
  }

  async cancelAll(): Promise<void> {
    this.logger.log(`[Bull] Cancelled all jobs`);
  }

  async listJobs(): Promise<SchedulerJob[]> {
    this.logger.log(`[Bull] Listing jobs`);
    return [];
  }

  async getJob(jobId: string): Promise<SchedulerJob | null> {
    this.logger.log(`[Bull] Get job: ${jobId}`);
    return null;
  }
}
