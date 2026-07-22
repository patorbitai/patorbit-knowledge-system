import { Injectable, Logger } from "@nestjs/common";
import type { AnyEvent } from "../event-bus.provider";

export interface DeadLetterEntry {
  id: string;
  event: AnyEvent;
  handlerName: string;
  error: string;
  failedAt: Date;
  retryCount: number;
}

@Injectable()
export class DeadLetterService {
  private readonly logger = new Logger(DeadLetterService.name);
  private readonly entries = new Map<string, DeadLetterEntry>();

  async sendToDeadLetter(
    event: AnyEvent,
    error: Error,
    retryCount: number,
    handlerName = "unknown",
  ): Promise<DeadLetterEntry> {
    const id = `${event.eventId}:${handlerName}`;
    const entry: DeadLetterEntry = {
      id,
      event,
      handlerName,
      error: error.message,
      failedAt: new Date(),
      retryCount,
    };

    this.entries.set(id, entry);
    this.logger.warn(
      `Moved ${event.eventType} (${event.eventId}) for ${handlerName} to the dead-letter queue after ${retryCount} retries: ${error.message}`,
    );
    return { ...entry };
  }

  async getAll(): Promise<DeadLetterEntry[]> {
    return Array.from(this.entries.values()).map((entry) => ({ ...entry }));
  }

  async get(id: string): Promise<DeadLetterEntry | null> {
    const entry = this.entries.get(id);
    return entry ? { ...entry } : null;
  }

  async remove(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }

  async retry(
    id: string,
    publish: (event: AnyEvent) => Promise<void>,
  ): Promise<boolean> {
    const entry = this.entries.get(id);
    if (!entry) return false;

    try {
      await publish(entry.event);
      this.entries.delete(id);
      return true;
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      this.entries.set(id, {
        ...entry,
        error: error.message,
        failedAt: new Date(),
      });
      return false;
    }
  }

  get deadLetterCount(): number {
    return this.entries.size;
  }
}
