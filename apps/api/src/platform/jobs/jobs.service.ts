import { Inject, Injectable } from "@nestjs/common";

import { JOB_QUEUES } from "./jobs.constants";
import {
  type Job,
  type JobOptions,
  type JobQueue,
  type JobStatus,
  type JobWorker,
  type JobWorkerOptions,
} from "./jobs.provider";

@Injectable()
export class JobsService {
  constructor(
    @Inject(JOB_QUEUES)
    private readonly queues: ReadonlyMap<string, JobQueue>,
  ) {}

  getQueue(name = "default"): JobQueue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Job queue "${name}" is not registered`);
    }
    return queue;
  }

  add<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<Job<T>> {
    return this.getQueue(queueName).add(jobName, data, options);
  }

  addJob<T>(
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<Job<T>> {
    return this.add("default", jobName, data, options);
  }

  getJob<T = unknown>(queueName: string, id: string): Promise<Job<T> | null> {
    return this.getQueue(queueName).getJob<T>(id);
  }

  getJobStatus(queueName: string, id: string): Promise<JobStatus> {
    return this.getQueue(queueName).getJobStatus(id);
  }

  process<T = unknown>(
    queueName: string,
    worker: JobWorker<T>,
    options?: JobWorkerOptions,
  ): void {
    this.getQueue(queueName).process(worker, options);
  }

  schedule<T>(
    queueName: string,
    jobName: string,
    data: T,
    delay: number,
    options?: Omit<JobOptions, "delay">,
  ): Promise<Job<T>> {
    return this.add(queueName, jobName, data, { ...options, delay });
  }

  repeat<T>(
    queueName: string,
    jobName: string,
    data: T,
    repeat: NonNullable<JobOptions["repeat"]>,
    options?: Omit<JobOptions, "repeat">,
  ): Promise<Job<T>> {
    return this.add(queueName, jobName, data, { ...options, repeat });
  }
}
