export type JobStatus =
  | "waiting"
  | "delayed"
  | "active"
  | "completed"
  | "failed"
  | "unknown";

export interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
  opts: JobOptions;
  status: JobStatus;
  attemptsMade: number;
  failedReason?: string;
}

export interface RecurringJobOptions {
  /** Run the job at this interval, in milliseconds. */
  every?: number;
  /** Five-field cron expression. */
  cron?: string;
}

export interface RateLimitOptions {
  /** Maximum number of jobs processed during the duration. */
  max: number;
  /** Rate-limit window in milliseconds. */
  duration: number;
}

export interface JobOptions {
  /** Total processing attempts, including the first attempt. */
  attempts?: number;
  /** Delay in milliseconds before the first run. */
  delay?: number;
  /** Recurring schedule. */
  repeat?: RecurringJobOptions;
  /** Retry backoff strategy. */
  backoff?: {
    type: "fixed" | "exponential";
    delay: number;
  };
  /** Caller-supplied job identifier (maps directly to BullMQ's jobId). */
  jobId?: string;
  /** Retain completed jobs for status lookups. */
  removeOnComplete?: boolean;
  /** Retain failed jobs for status lookups. */
  removeOnFail?: boolean;
}

export interface JobWorkerOptions {
  concurrency?: number;
  limiter?: RateLimitOptions;
}

export type JobWorker<T = unknown> = (job: Job<T>) => Promise<unknown>;

export interface JobQueue {
  readonly name: string;
  add<T>(name: string, data: T, options?: JobOptions): Promise<Job<T>>;
  getJob<T = unknown>(id: string): Promise<Job<T> | null>;
  getJobStatus(id: string): Promise<JobStatus>;
  process<T = unknown>(
    worker: JobWorker<T>,
    options?: JobWorkerOptions,
  ): void;
}
