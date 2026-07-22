import { Injectable, Logger } from "@nestjs/common";
import type { AnyEvent } from "../event-bus.provider";

export type OutboxStatus = "pending" | "published" | "failed";

export interface OutboxEntry {
  id: string;
  eventType: string;
  eventKind: AnyEvent["kind"];
  payload: AnyEvent;
  status: OutboxStatus;
  createdAt: Date;
  publishedAt?: Date;
  failedAt?: Date;
  error?: string;
}

/**
 * Persistence boundary for a future Prisma implementation. A Prisma adapter can
 * implement this interface without changing EventBusService.
 */
export interface OutboxRepository {
  create(entry: OutboxEntry): Promise<OutboxEntry>;
  update(id: string, changes: Partial<OutboxEntry>): Promise<void>;
  findById(id: string): Promise<OutboxEntry | null>;
  findPending(limit?: number): Promise<OutboxEntry[]>;
  findAll(): Promise<OutboxEntry[]>;
  delete(id: string): Promise<boolean>;
}

@Injectable()
export class OutboxService implements OutboxRepository {
  private readonly logger = new Logger(OutboxService.name);
  private readonly entries = new Map<string, OutboxEntry>();

  async add(event: AnyEvent): Promise<OutboxEntry> {
    const entry: OutboxEntry = {
      id: event.eventId,
      eventType: event.eventType,
      eventKind: event.kind,
      payload: event,
      status: "pending",
      createdAt: new Date(),
    };
    return this.create(entry);
  }

  async create(entry: OutboxEntry): Promise<OutboxEntry> {
    const stored = { ...entry };
    this.entries.set(stored.id, stored);
    this.logger.debug(`Stored ${stored.eventType} (${stored.id}) in the outbox.`);
    return { ...stored };
  }

  async update(id: string, changes: Partial<OutboxEntry>): Promise<void> {
    const current = this.entries.get(id);
    if (current) this.entries.set(id, { ...current, ...changes });
  }

  async markPublished(id: string): Promise<void> {
    await this.update(id, {
      status: "published",
      publishedAt: new Date(),
      failedAt: undefined,
      error: undefined,
    });
  }

  async markFailed(id: string, error: Error): Promise<void> {
    await this.update(id, {
      status: "failed",
      failedAt: new Date(),
      error: error.message,
    });
  }

  async findById(id: string): Promise<OutboxEntry | null> {
    const entry = this.entries.get(id);
    return entry ? { ...entry } : null;
  }

  async findPending(limit = Number.POSITIVE_INFINITY): Promise<OutboxEntry[]> {
    return Array.from(this.entries.values())
      .filter((entry) => entry.status === "pending")
      .slice(0, limit)
      .map((entry) => ({ ...entry }));
  }

  async findAll(): Promise<OutboxEntry[]> {
    return Array.from(this.entries.values()).map((entry) => ({ ...entry }));
  }

  async delete(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }

  // Convenience aliases retained for direct service consumers.
  get(id: string): Promise<OutboxEntry | null> {
    return this.findById(id);
  }

  getPending(limit?: number): Promise<OutboxEntry[]> {
    return this.findPending(limit);
  }

  getAll(): Promise<OutboxEntry[]> {
    return this.findAll();
  }

  remove(id: string): Promise<boolean> {
    return this.delete(id);
  }

  get pendingCount(): number {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.status === "pending",
    ).length;
  }
}
