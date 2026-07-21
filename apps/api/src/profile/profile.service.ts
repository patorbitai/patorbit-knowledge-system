import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../packages/database/prisma.service";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        claims: { include: { _count: { select: { evidences: true } } } },
        organizationMembers: { include: { organization: true } },
        knowledgeNodes: true,
      },
    });
    if (!profile) throw new NotFoundException("Profile not found");
    return profile;
  }

  async findById(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        claims: { include: { _count: { select: { evidences: true } } } },
        organizationMembers: { include: { organization: true } },
      },
    });
    if (!profile) throw new NotFoundException("Profile not found");
    return profile;
  }

  async update(
    userId: string,
    data: { name?: string; headline?: string; summary?: string; avatarUrl?: string; locale?: string; timezone?: string }
  ) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Profile not found");

    return this.prisma.profile.update({
      where: { userId },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async softDelete(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Profile not found");

    await this.prisma.profile.update({
      where: { userId },
      data: { deletedAt: new Date() },
    });
  }
}
