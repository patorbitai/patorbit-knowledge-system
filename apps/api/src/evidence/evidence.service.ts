
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../packages/database/prisma.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { AttachFileDto } from './dto/attach-file.dto';

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  create(claimId: string, dto: CreateEvidenceDto) {
    return this.prisma.evidence.create({
      data: {
        claimId,
        ...dto,
      },
    });
  }

  findByClaim(claimId: string) {
    return this.prisma.evidence.findMany({
      where: {
        claimId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findById(id: string) {
    return this.prisma.evidence.findFirst({
      where: { id, deletedAt: null },
      include: {
        files: true,
        verifications: true,
      },
    });
  }

  async update(id: string, dto: UpdateEvidenceDto) {
    const existing = await this.findById(id);
    if (!existing) {
        throw new NotFoundException(`Evidence with ID ${id} not found`);
    }
    return this.prisma.evidence.update({
      where: { id },
      data: {
        ...dto,
        version: {
          increment: 1,
        },
      },
    });
  }

  async softDelete(id: string) {
    const existing = await this.findById(id);
    if (!existing) {
        throw new NotFoundException(`Evidence with ID ${id} not found`);
    }
    return this.prisma.evidence.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async attachFile(evidenceId: string, fileData: AttachFileDto) {
    return this.prisma.evidenceFile.create({
      data: {
        evidenceId,
        ...fileData,
      },
    });
  }

  async removeFile(fileId: string) {
    return this.prisma.evidenceFile.update({
      where: { id: fileId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  getFiles(evidenceId: string) {
    return this.prisma.evidenceFile.findMany({
        where: {
            evidenceId: evidenceId,
            deletedAt: null,
        },
    });
  }
}
