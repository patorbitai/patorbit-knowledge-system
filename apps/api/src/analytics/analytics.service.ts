import { Injectable } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [users, profiles, resumes, claims, organizations] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.profile.count({ where: { deletedAt: null } }),
      this.prisma.resume.count({ where: { deletedAt: null } }),
      this.prisma.claim.count({ where: { deletedAt: null } }),
      this.prisma.organization.count({ where: { deletedAt: null } }),
    ]);

    return { users, profiles, resumes, claims, organizations };
  }

  async getUserGrowth(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const records = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    return this.bucketByDate(records, 'createdAt', days);
  }

  async getResumeStats() {
    const [draft, active, archived] = await Promise.all([
      this.prisma.resume.count({ where: { status: 'DRAFT', deletedAt: null } }),
      this.prisma.resume.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.resume.count({ where: { status: 'ARCHIVED', deletedAt: null } }),
    ]);
    return { draft, active, archived, total: draft + active + archived };
  }

  async getClaimStats() {
    const claims = await this.prisma.claim.findMany({
      where: { deletedAt: null },
      select: { confidenceScore: true, isPublic: true, _count: { select: { evidences: true } } },
    });

    return {
      total: claims.length,
      public: claims.filter((c) => c.isPublic).length,
      avgConfidence: claims.length
        ? claims.reduce((sum, c) => sum + c.confidenceScore, 0) / claims.length
        : 0,
      totalEvidences: claims.reduce((sum, c) => sum + c._count.evidences, 0),
    };
  }

  async getTimeline(profileId: string, limit = 20) {
    return this.prisma.timelineEvent.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private bucketByDate(
    records: { createdAt: Date }[],
    _field: string,
    days: number,
  ): { date: string; count: number }[] {
    const map = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const r of records) {
      const key = r.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}
