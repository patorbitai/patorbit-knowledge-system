import { HealthCheckError, type HealthIndicatorResult } from '@nestjs/terminus';
import { describe, expect, it, vi } from 'vitest';

import { PrismaHealthIndicator } from './prisma.health';

type PrismaService = { $queryRaw: (strings: TemplateStringsArray) => Promise<unknown> };

const KEY = 'database';

describe('PrismaHealthIndicator', () => {
  it('returns an up status when the query succeeds', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]) };
    const indicator = new PrismaHealthIndicator(prisma as unknown as PrismaService);

    const result = await indicator.isHealthy(KEY);

    expect(result).toEqual({
      database: { status: 'up' },
    } as HealthIndicatorResult);
  });

  it('throws a HealthCheckError when the query fails', async () => {
    const prisma = { $queryRaw: vi.fn().mockRejectedValue(new Error('connection refused')) };
    const indicator = new PrismaHealthIndicator(prisma as unknown as PrismaService);

    await expect(indicator.isHealthy(KEY)).rejects.toThrow(HealthCheckError);
  });
});
