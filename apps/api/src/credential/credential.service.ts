// apps/api/src/credential/credential.service.ts
import { ConflictException,Injectable, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';

import { type CreateCredentialDto } from './dto/create-credential.dto';
import { type UpdateCredentialDto } from './dto/update-credential.dto';

@Injectable()
export class CredentialService {
  constructor(private prisma: PrismaService) {}

  async create(evidenceId: string, createCredentialDto: CreateCredentialDto) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID "${evidenceId}" not found`);
    }

    const existingCredential = await this.prisma.credential.findUnique({
        where: { evidenceId },
    });

    if (existingCredential) {
        throw new ConflictException(`Credential for evidence ID "${evidenceId}" already exists`);
    }

    return this.prisma.credential.create({
      data: {
        ...createCredentialDto,
        evidence: {
          connect: { id: evidenceId },
        },
      },
    });
  }

  async findByEvidence(evidenceId: string) {
    const credential = await this.prisma.credential.findUnique({
      where: { evidenceId },
    });
    if (!credential) {
      throw new NotFoundException(`Credential for evidence ID "${evidenceId}" not found`);
    }
    return credential;
  }

  async findById(id: string) {
    const credential = await this.prisma.credential.findUnique({
      where: { id },
    });
    if (!credential) {
      throw new NotFoundException(`Credential with ID "${id}" not found`);
    }
    return credential;
  }

  async update(id: string, updateCredentialDto: UpdateCredentialDto) {
    await this.findById(id);
    return this.prisma.credential.update({
      where: { id },
      data: updateCredentialDto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.credential.delete({
      where: { id },
    });
  }
}
