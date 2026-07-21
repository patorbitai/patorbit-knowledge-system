
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../packages/database/prisma.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';

@Injectable()
export class ClaimService {
  constructor(private readonly prisma: PrismaService) {}

  create(profileId: string, dto: CreateClaimDto) {
    return this.prisma.claim.create({
      data: {
        profileId,
        ...dto,
      },
    });
  }

  findAll(profileId: string) {
    return this.prisma.claim.findMany({
      where: {
        profileId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findById(id: string) {
    return this.prisma.claim.findFirst({
      where: { id, deletedAt: null },
      include: {
        evidences: true,
        tags: true,
      },
    });
  }

  async update(id: string, dto: UpdateClaimDto) {
    const existingClaim = await this.findById(id);
    if (!existingClaim) {
        throw new NotFoundException(`Claim with ID ${id} not found`);
    }

    return this.prisma.claim.update({
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
    const existingClaim = await this.findById(id);
    if (!existingClaim) {
        throw new NotFoundException(`Claim with ID ${id} not found`);
    }
    return this.prisma.claim.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async addTag(claimId: string, tagName: string) {
    const tag = await this.prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
    });

    return this.prisma.claim.update({
        where: { id: claimId },
        data: {
            tags: {
                connect: { id: tag.id },
            },
        },
    });
  }

  async removeTag(claimId: string, tagName: string) {
    const tag = await this.prisma.tag.findUnique({
        where: { name: tagName },
    });

    if (!tag) {
        throw new NotFoundException(`Tag with name ${tagName} not found`);
    }

    return this.prisma.claim.update({
        where: { id: claimId },
        data: {
            tags: {
                disconnect: { id: tag.id },
            },
        },
    });
  }
}
