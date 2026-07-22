
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@patorbit/database';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SectionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(resumeId: string, dto: CreateSectionDto) {
    // Auto-assign sortOrder if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const max = await this.prisma.resumeSection.aggregate({
        where: { resumeId, deletedAt: null },
        _max: { sortOrder: true },
      });
      sortOrder = (max._max.sortOrder ?? -1) + 1;
    }

    return this.prisma.resumeSection.create({
      data: {
        resumeId,
        ...dto,
        sortOrder,
      },
    });
  }

  async findAllByResume(resumeId: string) {
    return this.prisma.resumeSection.findMany({
      where: { resumeId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(resumeId: string, id: string) {
    const section = await this.prisma.resumeSection.findFirst({
      where: { id, resumeId, deletedAt: null },
    });
    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }
    return section;
  }

  async update(
    resumeId: string,
    id: string,
    dto: UpdateSectionDto & { expectedVersion?: number },
  ) {
    await this.findOne(resumeId, id);

    const where: any = { id, resumeId };
    if (dto.expectedVersion) where.version = dto.expectedVersion;

    try {
      return await this.prisma.resumeSection.update({
        where,
        data: {
          title: dto.title,
          type: dto.type,
          sortOrder: dto.sortOrder,
          isVisible: dto.isVisible,
          isCollapsible: dto.isCollapsible,
          isCollapsed: dto.isCollapsed,
          content: dto.content as any,
          metadata: dto.metadata as any,
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
            ? 'Section was modified by another session.'
            : `Section with ID ${id} not found`,
        );
      }
      throw err;
    }
  }

  async updateContent(
    resumeId: string,
    id: string,
    content: Record<string, any>,
  ) {
    await this.findOne(resumeId, id);
    return this.prisma.resumeSection.update({
      where: { id, resumeId },
      data: { content: content as any, version: { increment: 1 } },
    });
  }

  async softDelete(resumeId: string, id: string) {
    await this.findOne(resumeId, id);
    return this.prisma.resumeSection.update({
      where: { id, resumeId },
      data: { deletedAt: new Date() },
    });
  }

  async reorder(resumeId: string, orders: { id: string; sortOrder: number }[]) {
    const existing = await this.prisma.resumeSection.findMany({
      where: { id: { in: orders.map((o) => o.id) }, resumeId, deletedAt: null },
    });
    const idMap = new Map(existing.map((s) => [s.id, s]));

    return this.prisma.$transaction(
      orders.map((o) => {
        if (!idMap.has(o.id))
          throw new NotFoundException(`Section ${o.id} not found`);
        return this.prisma.resumeSection.update({
          where: { id: o.id, resumeId },
          data: { sortOrder: o.sortOrder },
        });
      }),
    );
  }

  async toggleVisibility(resumeId: string, id: string, collapse?: boolean) {
    const section = await this.findOne(resumeId, id);
    return this.prisma.resumeSection.update({
      where: { id, resumeId },
      data: {
        isVisible: !section.isVisible,
        ...(collapse !== undefined && { isCollapsed: collapse }),
        version: { increment: 1 },
      },
    });
  }
}
