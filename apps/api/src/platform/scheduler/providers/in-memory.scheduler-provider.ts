import { Injectable, Logger } from "@nestjs/common";

import  { type SchedulerJob,type SchedulerProvider } from "../scheduler.provider";

interface ScheduledEntry {
  job: SchedulerJob;
  timer: NodeJS.Timeout | null;
  runCount: number;
}

@Injectable()
export class InMemorySchedulerProvider implements SchedulerProvider {
  readonly name = "in-memory";
  private readonly logger = new Logger(InMemorySchedulerProvider.name);
  private readonly jobs: Map<string, ScheduledEntry> = new Map();

  async schedule(job: SchedulerJob): Promise<void> {
    this.cancel(job.id).catch(() => {});

    const entry: ScheduledEntry = { job, timer: null, runCount: 0 };

    if (job.type === "cron") {
      const ms = this.cronToMs(job.schedule as string);
      if (ms === null) {
        this.logger.warn(`Unsupported cron expression "${job.schedule}", skipping job "${job.name}"`);
        return;
      }
      entry.timer = setInterval(() => this.execute(entry), ms);
      this.logger.log(`Scheduled cron job "${job.name}" every ${ms}ms`);
    } else if (job.type === "interval") {
      const ms = job.schedule as number;
      entry.timer = setInterval(() => this.execute(entry), ms);
      this.logger.log(`Scheduled interval job "${job.name}" every ${ms}ms`);
    } else if (job.type === "timeout") {
      entry.timer = setTimeout(() => this.execute(entry), job.schedule as number);
      this.logger.log(`Scheduled timeout job "${job.name}" in ${job.schedule}ms`);
    }

    this.jobs.set(job.id, entry);
  }

  async cancel(jobId: string): Promise<void> {
    const entry = this.jobs.get(jobId);
    if (!entry) return;

    if (entry.timer) {
      clearInterval(entry.timer);
      clearTimeout(entry.timer);
    }
    this.jobs.delete(jobId);
    this.logger.log(`Cancelled job "${entry.job.name}" (${jobId})`);
  }

  async cancelAll(): Promise<void> {
    for (const jobId of this.jobs.keys()) {
      await this.cancel(jobId);
    }
    this.logger.log("Cancelled all scheduled jobs");
  }

  async listJobs(): Promise<SchedulerJob[]> {
    return Array.from(this.jobs.values()).map((e) => e.job);
  }

  async getJob(jobId: string): Promise<SchedulerJob | null> {
    return this.jobs.get(jobId)?.job ?? null;
  }

  private async execute(entry: ScheduledEntry): Promise<void> {
    try {
      const maxRuns = entry.job.options?.maxRuns;
      if (maxRuns !== undefined && entry.runCount >= maxRuns) {
        await this.cancel(entry.job.id);
        return;
      }
      entry.runCount++;
      await entry.job.handler();
    } catch (error) {
      this.logger.error(
        `Job "${entry.job.name}" (${entry.job.id}) failed: ${(error as Error).message}`
      );
    }
  }

  private cronToMs(expression: string): number | null {
    // Simple cron-like parser for common patterns
    const trimmed = expression.trim();
    if (trimmed === "* * * * *") return 60_000;
    if (trimmed === "*/1 * * * *") return 60_000;
    if (trimmed === "*/5 * * * *") return 300_000;
    if (trimmed === "*/10 * * * *") return 600_000;
    if (trimmed === "*/15 * * * *") return 900_000;
    if (trimmed === "*/30 * * * *") return 1_800_000;
    if (trimmed === "0 * * * *") return 3_600_000;
    if (trimmed === "0 */6 * * *") return 21_600_000;
    if (trimmed === "0 0 * * *") return 86_400_000;
    if (trimmed === "0 0 * * 0") return 604_800_000;

    // Try to parse "*/N * * * *" pattern
    const everyNMatch = trimmed.match(/^\*\/(\d+) \* \* \* \*$/);
    if (everyNMatch) {
      const minutes = parseInt(everyNMatch[1], 10);
      if (minutes > 0 && minutes <= 59) return minutes * 60_000;
    }

    // Try to parse "N * * * *" (run at specific minute every hour)
    const specificMinuteMatch = trimmed.match(/^(\d+) \* \* \* \*$/);
    if (specificMinuteMatch) {
      const minute = parseInt(specificMinuteMatch[1], 10);
      if (minute >= 0 && minute <= 59) return 3_600_000; // every hour
    }

    return null;
  }
}
