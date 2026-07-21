
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../packages/database/prisma.service';

@Injectable()
export class ConfidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(entityType: string, entityId: string) {
    let confidenceScore = await this.prisma.confidenceScore.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
    });

    if (!confidenceScore) {
      const calculatedScore = this.calculateInitialScore(entityType, entityId);
      confidenceScore = await this.prisma.confidenceScore.create({
        data: {
          entityType,
          entityId,
          score: calculatedScore,
          reason: 'Initial score calculation.',
        },
      });
    }

    return confidenceScore;
  }

  async recalculate(entityType: string, entityId: string) {
    // This is a placeholder for more complex logic based on evidence quality.
    const score = Math.random() * 100;

    return this.prisma.confidenceScore.update({
      where: { entityType_entityId: { entityType, entityId } },
      data: {
        score,
        reason: 'Recalculated based on evidence quality.',
        version: { increment: 1 },
      },
    });
  }

  async update(id: string, dto: { score: number; reason?: string }) {
    return this.prisma.confidenceScore.update({
      where: { id },
      data: {
        ...dto,
        version: { increment: 1 },
      },
    });
  }

  private calculateInitialScore(entityType: string, entityId: string): number {
    // Placeholder for initial confidence logic
    return 50.0;
  }
}
