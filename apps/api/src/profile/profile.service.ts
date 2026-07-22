import { Injectable, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';

import { type UpdateProfileDto } from './dto/update-profile.dto';

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
        _count: { select: { resumes: true, careerPassports: true } },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
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
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(userId: string, data: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

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
    if (!profile) throw new NotFoundException('Profile not found');

    await this.prisma.profile.update({
      where: { userId },
      data: { deletedAt: new Date() },
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // Store avatar path — in production, upload to S3/Minio and store the URL.
    // For now, we store a local path reference that maps to a static file serve.
    const avatarUrl = `/uploads/avatars/${userId}/${file.filename ?? file.originalname}`;

    await this.prisma.profile.update({
      where: { userId },
      data: { avatarUrl, version: { increment: 1 } },
    });

    return { avatarUrl };
  }
}
