
import { Injectable, NotFoundException } from '@nestjs/common';
import { type Evidence,type PrismaService } from '@patorbit/database';

import { type AttachFileDto } from './dto/attach-file.dto';
import { type CreateEvidenceDto } from './dto/create-evidence.dto';
import { type UpdateEvidenceDto } from './dto/update-evidence.dto';

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  create(claimId: string, dto: CreateEvidenceDto): Promise<Evidence> {
    return this.prisma.evidence.create({
      data: {
        claimId,
        ...dto,
      },
    });
  }

  findByClaim(claimId: string): Promise<Evidence[]> {
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

  findById(id: string): Promise<Evidence | null> {
    return this.prisma.evidence.findFirst({
      where: { id, deletedAt: null },
      include: {
        files: true,
        verifications: true,
      },
    });
  }

  async update(id: string, dto: UpdateEvidenceDto): Promise<Evidence> {
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

  async softDelete(id: string): Promise<Evidence> {
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

  async attachFile(evidenceId: string, fileData: AttachFileDto): Promise<any> {
    return this.prisma.evidenceFile.create({
      data: {
        evidenceId,
        ...fileData,
      },
    });
  }

  async removeFile(fileId: string): Promise<any> {
    return this.prisma.evidenceFile.update({
      where: { id: fileId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  getFiles(evidenceId: string): Promise<any> {
    return this.prisma.evidenceFile.findMany({
        where: {
            evidenceId: evidenceId,
            deletedAt: null,
        },
    });
  }
}
