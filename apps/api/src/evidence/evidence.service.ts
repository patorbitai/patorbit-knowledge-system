import { Injectable, NotFoundException } from '@nestjs/common';
import { type Evidence, type PrismaService } from '@patorbit/database';

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

  async verifyOwnership(evidenceId: string, profileId: string): Promise<Evidence> {
    const evidence = await this.prisma.evidence.findFirst({
      where: {
        id: evidenceId,
        deletedAt: null,
        claim: { profileId, deletedAt: null },
      },
    });
    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${evidenceId} not found`);
    }
    return evidence;
  }

  async update(id: string, profileId: string, dto: UpdateEvidenceDto): Promise<Evidence> {
    await this.verifyOwnership(id, profileId);
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

  async softDelete(id: string, profileId: string): Promise<Evidence> {
    await this.verifyOwnership(id, profileId);
    return this.prisma.evidence.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async attachFile(evidenceId: string, profileId: string, fileData: AttachFileDto): Promise<any> {
    await this.verifyOwnership(evidenceId, profileId);
    return this.prisma.evidenceFile.create({
      data: {
        evidenceId,
        ...fileData,
      },
    });
  }

  async removeFile(fileId: string, profileId: string): Promise<any> {
    const file = await this.prisma.evidenceFile.findUnique({
      where: { id: fileId },
      include: { evidence: { include: { claim: true } } },
    });
    if (!file || file.evidence.claim.profileId !== profileId) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }
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
