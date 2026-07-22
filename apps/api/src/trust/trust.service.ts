
import { Injectable, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';
import { VerificationStatus } from '@patorbit/database';

@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(entityType: string, entityId: string) {
    const existing = await this.prisma.trustScore.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
    });
    if (existing) return existing;

    const score = await this.calculateScore(entityType, entityId);
    return this.prisma.trustScore.create({
      data: {
        entityType,
        entityId,
        score: score,
        reason: 'Initial score calculation',
        version: 1,
      },
    });
  }

  async recalculate(entityType: string, entityId: string) {
    const score = await this.calculateScore(entityType, entityId);
    const existing = await this.prisma.trustScore.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
    });

    if (!existing) {
      throw new NotFoundException(
        `TrustScore for ${entityType}:${entityId} not found. Cannot recalculate.`,
      );
    }

    return this.prisma.trustScore.update({
      where: { id: existing.id },
      data: {
        score: score,
        reason: 'Recalculated based on verification status',
        version: { increment: 1 },
      },
    });
  }

  async update(id: string, dto: { score: number; reason?: string }) {
    return this.prisma.trustScore.update({
      where: { id },
      data: {
        ...dto,
        version: { increment: 1 },
      },
    });
  }

  private async calculateScore(
    entityType: string,
    entityId: string,
  ): Promise<number> {
    if (entityType !== 'Claim') {
      return 50; // Default score for non-claim entities
    }

    const claim = await this.prisma.claim.findUnique({
      where: { id: entityId },
      include: {
        evidences: {
          include: {
            verifications: true,
          },
        },
      },
    });

    if (!claim || claim.evidences.length === 0) {
      return 10; // Low score if no evidence
    }

    const verificationScores = claim.evidences.flatMap(e => e.verifications).map(v => {
      switch (v.status) {
        case VerificationStatus.VERIFIED:
          return 100;
        case VerificationStatus.PENDING:
          return 50;
        case VerificationStatus.REJECTED:
          return 0;
        default:
          return 25;
      }
    });

    if(verificationScores.length === 0) {
      return 30; // Has evidence but no verifications yet
    }

    const totalScore = verificationScores.reduce<number>((acc, score) => acc + score, 0);
    return totalScore / verificationScores.length;
  }
}
