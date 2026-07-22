
import { Injectable, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';
import { type Prisma } from '@patorbit/database';

@Injectable()
export class CareerPassportService {
  constructor(private readonly prisma: PrismaService) {}

  async createVersion(profileId: string, snapshot: Record<string, unknown>) {
    const latest = await this.prisma.careerPassportVersion.findFirst({
      where: { profileId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = latest ? latest.version + 1 : 1;

    return this.prisma.careerPassportVersion.create({
      data: {
        profileId,
        version: nextVersion,
        snapshot: snapshot as Prisma.InputJsonValue,
      },
    });
  }

  async findByProfile(profileId: string) {
    return this.prisma.careerPassportVersion.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const version = await this.prisma.careerPassportVersion.findUnique({
      where: { id },
    });

    if (!version) {
      throw new NotFoundException(`CareerPassportVersion with id "${id}" not found`);
    }

    return version;
  }

  async publish(id: string) {
    return this.prisma.careerPassportVersion.update({
      where: { id },
      data: {
        isPublic: true,
        publishedAt: new Date(),
      },
    });
  }

  async unpublish(id: string) {
    return this.prisma.careerPassportVersion.update({
      where: { id },
      data: {
        isPublic: false,
        publishedAt: null,
      },
    });
  }

  async getLatest(profileId: string) {
    const version = await this.prisma.careerPassportVersion.findFirst({
      where: { profileId },
      orderBy: { version: 'desc' },
    });

    if (!version) {
      throw new NotFoundException(
        `No CareerPassportVersion found for profile "${profileId}"`,
      );
    }

    return version;
  }
}
