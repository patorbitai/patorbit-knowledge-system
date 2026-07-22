import { Logger } from "@nestjs/common";
import { type Job as BullJob,type Queue as BullQueue, Worker } from "bullmq";

import  { type JobOptions } from "../jobs.provider";
import {
  type Job,
  type JobQueue,
  type JobStatus,
  type JobWorker,
  type JobWorkerOptions,
} from "../jobs.provider";

export class BullMQQueue implements JobQueue {
  private readonly logger = new Logger(BullMQQueue.name);
  private processor?: Worker;

  readonly name: string;

  constructor(private readonly bullQueue: BullQueue) {
    this.name = bullQueue.name;
  }

  async add<T>(
    name: string,
    data: T,
    opts: JobOptions = {},
  ): Promise<Job<T>> {
    const bullJob = await this.bullQueue.add(name, data as unknown, {
      attempts: opts.attempts,
      delay: opts.delay,
      repeat: opts.repeat,
      backoff: opts.backoff,
      jobId: opts.jobId,
      removeOnComplete: opts.removeOnComplete,
      removeOnFail: opts.removeOnFail,
    });

    return this.toJob<T>(bullJob);
  }

  process<T = unknown>(
    handler: JobWorker<T>,
    options?: JobWorkerOptions,
  ): void {
    if (this.processor) return;

    this.processor = new Worker(
      this.bullQueue.name,
      async (bullJob: BullJob) => {
        const job = this.toJob<T>(bullJob);
        await handler(job);
      },
      {
        connection: this.bullQueue.opts.connection,
        concurrency: options?.concurrency,
        limiter: options?.limiter,
      },
    );
  }

  async getJob<T = unknown>(id: string): Promise<Job<T> | null> {
    const bullJob = await this.bullQueue.getJob(id);
    return bullJob ? this.toJob<T>(bullJob) : null;
  }

  async getJobStatus(id: string): Promise<JobStatus> {
    const bullJob = await this.bullQueue.getJob(id);
    if (!bullJob) return "unknown";
    const state = await bullJob.getState();
    return state as JobStatus;
  }

  // ---------------------------------------------------------------
  //  Internal helpers
  // ---------------------------------------------------------------
  private toJob<T>(bull: BullJob): Job<T> {
    return {
      id: bull.id!,
      name: bull.name,
      data: bull.data as T,
      opts: {
        attempts: bull.opts.attempts,
        delay: bull.opts.delay,
        repeat: bull.opts.repeat as JobOptions["repeat"],
        backoff: bull.opts.backoff as JobOptions["backoff"],
        jobId: bull.opts.jobId,
      },
      status: "unknown",
      attemptsMade: bull.attemptsMade,
      failedReason: bull.failedReason,
    };
  }
}
