// apps/api/src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async searchAll(profileId: string, query: string) {
    const term = query.trim();
    if (!term) return { resumes: [], coverLetters: [] };

    const [resumes, coverLetters] = await Promise.all([
      this.prisma.resume.findMany({
        where: {
          profileId,
          deletedAt: null,
          title: { contains: term, mode: 'insensitive' },
        },
        select: { id: true, title: true, status: true, updatedAt: true },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.coverLetter.findMany({
        where: {
          profileId,
          deletedAt: null,
          title: { contains: term, mode: 'insensitive' },
        },
        select: { id: true, title: true, status: true, updatedAt: true },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      resumes: resumes.map((r) => ({ ...r, type: 'resume' as const })),
      coverLetters: coverLetters.map((c) => ({ ...c, type: 'cover-letter' as const })),
    };
  }
}
