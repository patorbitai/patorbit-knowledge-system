
import { ForbiddenException,Injectable, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';

import { type CreateTemplateDto } from './dto/create-template.dto';
import { type QueryTemplateDto } from './dto/query-template.dto';
import { type UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTemplateDto) {
    return this.prisma.resumeTemplate.findMany({
      where: {
        deletedAt: null,
        ...(query.category && { category: query.category }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.resumeTemplate.findFirst({
      where: { id, deletedAt: null },
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async create(createTemplateDto: CreateTemplateDto) {
    return this.prisma.resumeTemplate.create({
      data: {
        ...createTemplateDto,
        isSystem: false,
      },
    });
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto) {
    const template = await this.findOne(id);
    if (template.isSystem) {
      throw new ForbiddenException('System templates cannot be modified');
    }
    return this.prisma.resumeTemplate.update({
      where: { id },
      data: {
        ...updateTemplateDto,
        version: { increment: 1 },
      },
    });
  }
}
