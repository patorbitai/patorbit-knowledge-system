// apps/api/src/cover-letter/cover-letter.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';

import { type ProfileService } from '../profile/profile.service';
import { type CreateCoverLetterDto } from './dto/create-cover-letter.dto';
import { type QueryCoverLetterDto } from './dto/query-cover-letter.dto';
import { type UpdateCoverLetterDto } from './dto/update-cover-letter.dto';

@Injectable()
export class CoverLetterService {
  private readonly logger = new Logger(CoverLetterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
  ) {}

  async create(dto: CreateCoverLetterDto, userId: string) {
    const profile = await this.profileService.findByUserId(userId);
    return this.prisma.coverLetter.create({
      data: {
        profileId: profile.id,
        title: dto.title,
        ...(dto.folderId && { folderId: dto.folderId }),
      },
    });
  }

  async findAll(query: QueryCoverLetterDto, userId: string) {
    const profile = await this.profileService.findByUserId(userId);
    const { page = 1, limit = 10, search, sort, status, folderId } = query;
    const where: any = {
      profileId: profile.id,
      deletedAt: null,
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }
    if (folderId) {
      where.folderId = folderId;
    }

    const total = await this.prisma.coverLetter.count({ where });
    const data = await this.prisma.coverLetter.findMany({
      where,
      skip: (+page - 1) * +limit,
      take: +limit,
      orderBy: sort ? { [sort.split(':')[0]]: sort.split(':')[1] } : { updatedAt: 'desc' },
    });

    return {
      data,
      meta: { total, page: +page, limit: +limit, lastPage: Math.ceil(total / +limit) },
    };
  }

  async findOne(id: string, userId: string) {
    const profile = await this.profileService.findByUserId(userId);
    const letter = await this.prisma.coverLetter.findFirst({
      where: { id, profileId: profile.id, deletedAt: null },
    });
    if (!letter) throw new NotFoundException(`Cover letter with ID ${id} not found`);
    return letter;
  }

  async update(id: string, dto: UpdateCoverLetterDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.coverLetter.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content as any,
        status: dto.status,
        folderId: dto.folderId,
        version: { increment: 1 },
      },
    });
  }

  async softDelete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.coverLetter.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(id: string, userId: string) {
    const original = await this.findOne(id, userId);
    return this.prisma.coverLetter.create({
      data: {
        profileId: original.profileId,
        title: `${original.title} (Copy)`,
        content: original.content as any,
        status: 'DRAFT',
      },
    });
  }
}
