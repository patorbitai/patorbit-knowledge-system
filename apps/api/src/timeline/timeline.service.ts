
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../packages/database/prisma.service';

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    profileId: string,
    event: { entityType: string; entityId: string; type: string; data?: Record<string, unknown> },
  ) {
    return this.prisma.timelineEvent.create({
      data: {
        profileId,
        entityType: event.entityType,
        entityId: event.entityId,
        type: event.type,
        data: event.data ?? undefined,
      },
    });
  }

  async findByProfile(profileId: string) {
    return this.prisma.timelineEvent.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.timelineEvent.findUniqueOrThrow({
      where: { id },
    });
  }

  async delete(id: string) {
    return this.prisma.timelineEvent.delete({
      where: { id },
    });
  }
}
