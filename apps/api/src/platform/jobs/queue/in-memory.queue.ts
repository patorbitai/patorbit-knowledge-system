import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  Job,
  JobOptions,
  JobQueue,
  JobStatus,
  JobWorker,
  JobWorkerOptions,
} from "../jobs.provider";

interface InternalJob<T> {
  id: string;
  name: string;
  data: T;
  opts: JobOptions;
  status: JobStatus;
  attemptsMade: number;
  failedReason?: string;
}

@Injectable()
export class InMemoryQueue implements JobQueue, OnModuleInit {
  private readonly logger = new Logger(InMemoryQueue.name);
  private readonly jobs: Map<string, InternalJob<unknown>> = new Map();
  private readonly pending: InternalJob<unknown>[] = [];
  private handler?: JobWorker<unknown>;
  private workerOptions?: JobWorkerOptions;
  private processing = true;

  readonly name: string;

  constructor(name?: string) {
    this.name = name ?? "memory";
  }

  onModuleInit(): void {
    this.logger.log(`In-memory queue "${this.name}" initialized`);
    this.startProcessing().catch((err) =>
      this.logger.error("In-memory queue processor crashed", err),
    );
  }

  async add<T>(
    name: string,
    data: T,
    opts: JobOptions = {},
  ): Promise<Job<T>> {
    const job: InternalJob<T> = {
      id: opts.jobId ?? randomUUID(),
      name,
      data,
      opts,
      status: opts.delay ? "delayed" : "waiting",
      attemptsMade: 0,
    };

    this.jobs.set(job.id, job as InternalJob<unknown>);

    if (opts.delay && opts.delay > 0) {
      setTimeout(() => {
        this.pending.push(job as InternalJob<unknown>);
      }, opts.delay);
    } else {
      this.pending.push(job as InternalJob<unknown>);
    }

    return this.toPublic(job);
  }

  async getJob<T = unknown>(id: string): Promise<Job<T> | null> {
    const job = this.jobs.get(id);
    return job ? (this.toPublic(job) as Job<T>) : null;
  }

  async getJobStatus(_id: string): Promise<JobStatus> {
    const job = this.jobs.get(_id);
    return job?.status ?? "unknown";
  }

  process<T = unknown>(
    handler: JobWorker<T>,
    options?: JobWorkerOptions,
  ): void {
    this.handler = handler as JobWorker<unknown>;
    if (options) this.workerOptions = options;
  }

  // ------------------------------------------------------------------
  //  Internal processing loop
  // ------------------------------------------------------------------
  private async startProcessing(): Promise<void> {
    while (this.processing) {
      if (this.pending.length > 0 && this.handler) {
        const job = this.pending.shift()!;
        job.status = "active";
        job.attemptsMade++;

        try {
          await this.handler(job);
          job.status = "completed";
          if (job.opts.removeOnComplete) {
            this.jobs.delete(job.id);
          }

          // Recurring — re-queue
          if (job.opts.repeat) {
            const interval = job.opts.repeat.every ?? 5000;
            this.scheduleRepeating(job, interval);
          }
        } catch (error) {
          job.status = "failed";
          job.failedReason = (error as Error).message;
          this.logger.error(
            `Failed to process job ${job.id} (attempt ${job.attemptsMade}): ${job.failedReason}`,
          );

          if (
            job.opts.attempts &&
            job.opts.attempts > 1 &&
            job.attemptsMade < job.opts.attempts
          ) {
            // Back-off delay
            const backoffDelay = this.computeBackoff(job);
            setTimeout(() => {
              job.status = "waiting";
              this.pending.push(job);
            }, backoffDelay);
          } else if (job.opts.removeOnFail) {
            this.jobs.delete(job.id);
          }
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  private scheduleRepeating(job: InternalJob<unknown>, interval: number): void {
    setTimeout(() => {
      const repeatId = randomUUID();
      const repeatJob: InternalJob<unknown> = {
        id: repeatId,
        name: job.name,
        data: job.data,
        opts: { ...job.opts },
        status: "waiting",
        attemptsMade: 0,
      };
      this.jobs.set(repeatId, repeatJob);
      this.pending.push(repeatJob);
    }, interval);
  }

  private computeBackoff(job: InternalJob<unknown>): number {
    if (!job.opts.backoff) return 1000;
    if (job.opts.backoff.type === "fixed") return job.opts.backoff.delay;
    // exponential: base * 2^(attempt-1)
    return job.opts.backoff.delay * 2 ** (job.attemptsMade - 1);
  }

  private toPublic<T>(internal: InternalJob<T>): Job<T> {
    return {
      id: internal.id,
      name: internal.name,
      data: internal.data,
      opts: { ...internal.opts },
      status: internal.status,
      attemptsMade: internal.attemptsMade,
      failedReason: internal.failedReason,
    };
  }
}
