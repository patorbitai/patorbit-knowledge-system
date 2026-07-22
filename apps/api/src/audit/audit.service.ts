// apps/api/src/audit/audit.service.ts
import { Injectable } from "@nestjs/common";
import { type PrismaService } from '@patorbit/database';
import { type AuditEvent,type Prisma } from '@patorbit/database';

// ── Parameter types ────────────────────────────────────────────

export interface CreateAuditEventParams {
  /** ID of the user who performed the action (nullable for unauthenticated requests). */
  userId?: string;
  /** Action descriptor (e.g. "user.login", "claim.create"). */
  action: string;
  /** The type of resource that was affected (e.g. "claim", "evidence"). */
  resource?: string;
  /** ID of the specific resource instance. */
  resourceId?: string;
  /** Arbitrary JSON metadata attached to the event. */
  metadata?: Record<string, unknown>;
  /** Client IP address. */
  ipAddress?: string;
  /** User-Agent header value. */
  userAgent?: string;
  /** Outcome of the operation — "success" or "failure". */
  outcome?: string;
  /**
   * Correlation ID that links this event to a broader request / transaction.
   * Stored inside `metadata` because the current schema has no dedicated column.
   */
  correlationId?: string;
}

export interface AuditEventFilter {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  outcome?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedAuditEvents {
  events: AuditEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Service ────────────────────────────────────────────────────

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist a single audit event.
   *
   * This is the primary write method.  It normalises required fields and merges
   * the correlation ID into the metadata payload so it survives in the JSON
   * column without a dedicated database column.
   */
  async log(params: CreateAuditEventParams): Promise<AuditEvent> {
    const metadata: Record<string, unknown> = { ...(params.metadata ?? {}) };

    if (params.correlationId) {
      metadata.correlationId = params.correlationId;
    }

    return this.prisma.auditEvent.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        resource: params.resource ?? "unknown",
        resourceId: params.resourceId ?? null,
        // Prisma 5.x serialises plain objects to the native JSON column type.
        metadata: Object.keys(metadata).length > 0 ? (metadata as Prisma.InputJsonValue) : undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        outcome: params.outcome ?? "success",
      },
    });
  }

  /**
   * Alias for {@link log} – convenience method with a more descriptive name.
   */
  async createEvent(params: CreateAuditEventParams): Promise<AuditEvent> {
    return this.log(params);
  }

  // ── Queries ──────────────────────────────────────────────────

  /**
   * Find all audit events whose metadata JSON contains the given correlation ID.
   *
   * Uses Prisma's `string_contains` filter (PostgreSQL JSONB) for a fast
   * text-within-JSON search.
   */
  async findByCorrelationId(correlationId: string): Promise<AuditEvent[]> {
    return this.prisma.auditEvent.findMany({
      where: { metadata: { path: ['correlationId'], equals: correlationId } },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Return the most recent audit events for a given user. */
  async findByUser(
    userId: string,
    limit = 50,
  ): Promise<AuditEvent[]> {
    return this.prisma.auditEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /** Return audit events filtered by resource type and optionally by instance ID. */
  async findByResource(
    resource: string,
    resourceId?: string,
  ): Promise<AuditEvent[]> {
    return this.prisma.auditEvent.findMany({
      where: { resource, ...(resourceId ? { resourceId } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Paginated query with optional filters.
   *
   * @returns  Both the result set and metadata (total count, page info).
   */
  async findAll(
    params?: {
      page?: number;
      limit?: number;
      filters?: AuditEventFilter;
    },
  ): Promise<PaginatedAuditEvents> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const filters = params?.filters ?? {};
    const skip = (page - 1) * limit;

    const where: Prisma.AuditEventWhereInput = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.outcome) where.outcome = filters.outcome;
    if (filters.startDate || filters.endDate) {
      const createdAt: Record<string, Date> = {};
      if (filters.startDate) createdAt.gte = filters.startDate;
      if (filters.endDate) createdAt.lte = filters.endDate;
      where.createdAt = createdAt;
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
