
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';
import { Prisma } from '@patorbit/database';

import { type ProfileService } from '../profile/profile.service';
import { type CreateResumeDto } from './dto/create-resume.dto';
import { type DuplicateResumeDto } from './dto/duplicate-resume.dto';
import { type QueryResumeDto } from './dto/query-resume.dto';
import { type UpdateResumeDto } from './dto/update-resume.dto';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
  ) {}

  async create(dto: CreateResumeDto, userId: string) {
    const profile = await this.profileService.findByUserId(userId);
    const { templateId, ...rest } = dto;

    return this.prisma.resume.create({
      data: {
        ...rest,
        profileId: profile.id,
        ...(templateId && { templateId }),
      },
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findAll(query: QueryResumeDto, userId: string) {
    const profile = await this.profileService.findByUserId(userId);
    const { page = 1, limit = 10, search, sort, filter } = query;
    const where: Prisma.ResumeWhereInput = {
      profileId: profile.id,
      deletedAt: null,
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (filter) {
      const [key, value] = filter.split(':');
      if (key === 'status') {
        where.status = value as any;
      }
    }

    const total = await this.prisma.resume.count({ where });
    const data = await this.prisma.resume.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sort
        ? { [sort.split(':')[0]]: sort.split(':')[1] }
        : { updatedAt: 'desc' },
    });

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId?: string) {
    const where: Prisma.ResumeWhereInput = { id, deletedAt: null };
    if (userId) {
      const profile = await this.profileService.findByUserId(userId);
      where.profileId = profile.id;
    }

    const resume = await this.prisma.resume.findFirst({
      where,
      include: { sections: { orderBy: { sortOrder: 'asc' } }, template: true },
    });
    if (!resume)
      throw new NotFoundException(`Resume with ID ${id} not found`);
    return resume;
  }

  async update(
    id: string,
    dto: UpdateResumeDto & { expectedVersion?: number },
    userId: string,
  ) {
    await this.findOne(id, userId);

    // Optimistic locking: if expectedVersion is provided, only update if matches
    const where: Prisma.ResumeWhereUniqueInput = { id };
    if (dto.expectedVersion) {
      (where as any).version = dto.expectedVersion;
    }

    try {
      return await this.prisma.resume.update({
        where,
        data: {
          title: dto.title,
          status: dto.status,
          metadata: dto.metadata as any,
          theme: dto.theme as any,
          version: { increment: 1 },
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new ConflictException(
          dto.expectedVersion
            ? 'Resume was modified by another session. Refresh and retry.'
            : `Resume with ID ${id} not found`,
        );
      }
      throw err;
    }
  }

  async updateTitle(id: string, title: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.resume.update({
      where: { id },
      data: { title, version: { increment: 1 } },
    });
  }

  async softDelete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.resume.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(
    id: string,
    dto: DuplicateResumeDto,
    userId: string,
  ) {
    const original = await this.findOne(id, userId);
    const newResume = await this.prisma.resume.create({
      data: {
        profileId: original.profileId,
        title: dto.title || `${original.title} (Copy)`,
        status: 'DRAFT',
        templateId: original.templateId,
        theme: (original.theme ?? Prisma.JsonNull) as any,
        metadata: (original.metadata ?? Prisma.JsonNull) as any,
        sections: {
          create: original.sections.map((section) => ({
            type: section.type,
            title: section.title,
            sortOrder: section.sortOrder,
            isVisible: section.isVisible,
            isCollapsible: section.isCollapsible,
            isCollapsed: section.isCollapsed,
            content: (section.content ?? Prisma.JsonNull) as any,
            metadata: (section.metadata ?? Prisma.JsonNull) as any,
          })),
        },
      },
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
    });
    return newResume;
  }

  async archive(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.resume.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async findRecent(userId: string, limit = 5) {
    const profile = await this.profileService.findByUserId(userId);
    return this.prisma.resume.findMany({
      where: {
        profileId: profile.id,
        deletedAt: null,
        status: { not: 'ARCHIVED' },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async findDrafts(userId: string) {
    const profile = await this.profileService.findByUserId(userId);
    return this.prisma.resume.findMany({
      where: { profileId: profile.id, deletedAt: null, status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  // Versioning
  // ---------------------------------------------------------------------------

  async listVersions(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.resumeVersion.findMany({
      where: { resumeId: id },
      orderBy: { version: 'desc' },
    });
  }

  async createVersion(id: string, note: string | undefined, userId: string) {
    const resume = await this.findOne(id, userId);

    // Snapshot includes full resume with sections
    const snapshot = {
      title: resume.title,
      status: resume.status,
      templateId: resume.templateId,
      theme: resume.theme,
      metadata: resume.metadata,
      sections: (resume as any).sections ?? [],
    };

    const maxVersion = await this.prisma.resumeVersion.findFirst({
      where: { resumeId: id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (maxVersion?.version ?? 0) + 1;

    return this.prisma.resumeVersion.create({
      data: {
        resumeId: id,
        version: nextVersion,
        note: note ?? null,
        snapshot: snapshot as any,
      },
    });
  }

  async restoreVersion(id: string, versionId: string, userId: string) {
    await this.findOne(id, userId);

    const version = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });
    if (!version || version.resumeId !== id) {
      throw new NotFoundException(
        `Version ${versionId} not found for resume ${id}`,
      );
    }

    const snap = version.snapshot as any;

    await this.prisma.$transaction(async (tx) => {
      await tx.resumeSection.deleteMany({ where: { resumeId: id } });
      await tx.resume.update({
        where: { id },
        data: {
          title: snap.title,
          status: snap.status ?? 'DRAFT',
          templateId: snap.templateId ?? null,
          theme: snap.theme ?? Prisma.JsonNull,
          metadata: snap.metadata ?? Prisma.JsonNull,
          version: { increment: 1 },
          sections: {
            create: (snap.sections || []).map((s: any) => ({
              type: s.type,
              title: s.title ?? null,
              sortOrder: s.sortOrder ?? 0,
              isVisible: s.isVisible ?? true,
              isCollapsible: s.isCollapsible ?? true,
              isCollapsed: s.isCollapsed ?? false,
              content: s.content ?? Prisma.JsonNull,
              metadata: s.metadata ?? Prisma.JsonNull,
            })),
          },
        },
      });
    });

    return this.findOne(id, userId);
  }

  async compareVersions(
    id: string,
    versionAId: string,
    versionBId: string,
    userId: string,
  ) {
    await this.findOne(id, userId);
    const [vA, vB] = await Promise.all([
      this.prisma.resumeVersion.findUnique({ where: { id: versionAId } }),
      this.prisma.resumeVersion.findUnique({ where: { id: versionBId } }),
    ]);

    if (!vA || !vB || vA.resumeId !== id || vB.resumeId !== id) {
      throw new NotFoundException('One or both versions not found');
    }

    return {
      versionA: { id: vA.id, version: vA.version, snapshot: vA.snapshot },
      versionB: { id: vB.id, version: vB.version, snapshot: vB.snapshot },
    };
  }
}
