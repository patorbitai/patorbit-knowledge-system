import { Injectable, Logger,type OnModuleInit } from "@nestjs/common";

import  { type Email, type EmailProvider } from "./email.provider";
import  { type Queue } from "./email-queue.service";

@Injectable()
export class InMemoryQueue implements Queue<Email>, OnModuleInit {
  private readonly logger = new Logger(InMemoryQueue.name);
  private queue: Email[] = [];
  private handler?: (job: Email) => Promise<void>;

  onModuleInit(): void {
    this.logger.log("In-memory queue initialized. Starting processor...");
    this.startProcessing();
  }

  async add(job: Email): Promise<void> {
    this.queue.push(job);
  }

  process(handler: (job: Email) => Promise<void>): void {
    this.handler = handler;
  }

  private async startProcessing(): Promise<void> {
    while (true) {
      if (this.queue.length > 0 && this.handler) {
        const job = this.queue.shift()!;
        try {
          await this.handler(job);
        } catch (error) {
          this.logger.error(`Error processing email job: ${(error as Error).message}`, (error as Error).stack);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Poll every 5 seconds
    }
  }
}
