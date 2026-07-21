import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../../packages/database/prisma.service";
import { OrganizationRole } from "@prisma/client";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto, creatorProfileId: string) {
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        description: dto.description,
        website: dto.website,
        logoUrl: dto.logoUrl,
        members: {
          create: {
            profileId: creatorProfileId,
            role: OrganizationRole.OWNER,
          },
        },
      },
      include: {
        members: {
          include: { profile: true },
        },
        workspaces: true,
        subscriptions: true,
      },
    });

    return organization;
  }

  async findAll() {
    return this.prisma.organization.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { members: true, workspaces: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const organization = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: {
          include: { profile: true },
          orderBy: { createdAt: "asc" },
        },
        workspaces: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findById(id);

    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      },
    });
  }

  async softDelete(id: string) {
    await this.findById(id);

    return this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addMember(organizationId: string, profileId: string, role: OrganizationRole) {
    await this.findById(organizationId);

    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_profileId: {
          organizationId,
          profileId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException("Profile is already a member of this organization");
    }

    return this.prisma.organizationMember.create({
      data: {
        organizationId,
        profileId,
        role,
      },
      include: { profile: true },
    });
  }

  async removeMember(organizationId: string, profileId: string) {
    await this.findById(organizationId);

    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_profileId: {
          organizationId,
          profileId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException("Member not found in this organization");
    }

    if (member.role === OrganizationRole.OWNER) {
      throw new ConflictException("Cannot remove the owner of the organization");
    }

    return this.prisma.organizationMember.delete({
      where: { id: member.id },
    });
  }

  async updateMemberRole(organizationId: string, profileId: string, role: OrganizationRole) {
    await this.findById(organizationId);

    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_profileId: {
          organizationId,
          profileId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException("Member not found in this organization");
    }

    if (member.role === OrganizationRole.OWNER && role !== OrganizationRole.OWNER) {
      throw new ConflictException("Cannot change the role of the organization owner");
    }

    return this.prisma.organizationMember.update({
      where: { id: member.id },
      data: { role },
      include: { profile: true },
    });
  }

  async getMembers(organizationId: string) {
    await this.findById(organizationId);

    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: { profile: true },
      orderBy: { createdAt: "asc" },
    });
  }
}
