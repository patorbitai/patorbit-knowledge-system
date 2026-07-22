export interface SchedulerJob {
  id: string;
  name: string;
  type: "cron" | "interval" | "timeout";
  schedule: string | number;
  handler: () => Promise<void> | void;
  options?: {
    immediate?: boolean;
    maxRuns?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface SchedulerProvider {
  readonly name: string;
  schedule(job: SchedulerJob): Promise<void>;
  cancel(jobId: string): Promise<void>;
  cancelAll(): Promise<void>;
  listJobs(): Promise<SchedulerJob[]>;
  getJob(jobId: string): Promise<SchedulerJob | null>;
}
