// apps/api/src/verification/verification.service.ts
import { BadRequestException,Injectable, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';
import { VerificationStatus } from '@patorbit/database';

import { type CreateVerificationDto } from './dto/create-verification.dto';
import { type UpdateVerificationDto } from './dto/update-verification.dto';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async create(evidenceId: string, createVerificationDto: CreateVerificationDto) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID "${evidenceId}" not found`);
    }

    return this.prisma.verification.create({
      data: {
        ...createVerificationDto,
        evidence: {
          connect: { id: evidenceId },
        },
      },
    });
  }

  async findByEvidence(evidenceId: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID "${evidenceId}" not found`);
    }

    return this.prisma.verification.findMany({
      where: { evidenceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const verification = await this.prisma.verification.findUnique({
      where: { id },
    });

    if (!verification) {
      throw new NotFoundException(`Verification with ID "${id}" not found`);
    }

    return verification;
  }

  async updateStatus(id: string, status: VerificationStatus) {
    await this.findById(id);

    const validStatuses: VerificationStatus[] = [
      VerificationStatus.PENDING,
      VerificationStatus.VERIFIED,
      VerificationStatus.REJECTED,
      VerificationStatus.EXPIRED,
    ];

    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid verification status: "${status}"`);
    }

    return this.prisma.verification.update({
      where: { id },
      data: { status },
    });
  }

  async update(id: string, updateVerificationDto: UpdateVerificationDto) {
    await this.findById(id);
    return this.prisma.verification.update({
      where: { id },
      data: updateVerificationDto,
    });
  }
}
