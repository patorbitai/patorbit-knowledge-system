import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { type PrismaService } from '@patorbit/database';

import { type CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { type UpdateWorkspaceDto } from "./dto/update-workspace.dto";

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkspaceDto) {
    const organization = await this.prisma.organization.findFirst({
      where: { id: dto.organizationId, deletedAt: null },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID "${dto.organizationId}" not found`,
      );
    }

    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        organizationId: dto.organizationId,
      },
      include: {
        organization: true,
      },
    });
  }

  async findByOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID "${organizationId}" not found`,
      );
    }

    return this.prisma.workspace.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, deletedAt: null },
      include: {
        organization: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID "${id}" not found`);
    }

    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto) {
    await this.findById(id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.organizationId !== undefined) {
      const organization = await this.prisma.organization.findFirst({
        where: { id: dto.organizationId, deletedAt: null },
      });
      if (!organization) {
        throw new NotFoundException(
          `Organization with ID "${dto.organizationId}" not found`,
        );
      }
      data.organizationId = dto.organizationId;
    }

    return this.prisma.workspace.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    await this.findById(id);

    return this.prisma.workspace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
