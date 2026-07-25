// apps/api/src/folder/folder.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';

import { type ProfileService } from '../profile/profile.service';
import { type CreateFolderDto } from './dto/create-folder.dto';
import { type UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FolderService {
  private readonly logger = new Logger(FolderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
  ) {}

  async create(dto: CreateFolderDto, userId: string) {
    const profile = await this.profileService.findByUserId(userId);

    return this.prisma.folder.create({
      data: {
        name: dto.name,
        profileId: profile.id,
        ...(dto.parentId && { parentId: dto.parentId }),
      },
    });
  }

  async findAll(userId: string) {
    const profile = await this.profileService.findByUserId(userId);

    return this.prisma.folder.findMany({
      where: { profileId: profile.id },
      include: {
        _count: { select: { resumes: true, coverLetters: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const profile = await this.profileService.findByUserId(userId);
    const folder = await this.prisma.folder.findFirst({
      where: { id, profileId: profile.id },
      include: { children: true, _count: { select: { resumes: true, coverLetters: true } } },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID "${id}" not found`);
    }

    return folder;
  }

  async update(id: string, dto: UpdateFolderDto, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.folder.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    // Remove folderId reference from resumes and cover letters in this folder
    await this.prisma.resume.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });
    await this.prisma.coverLetter.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    // Delete child folders
    await this.prisma.folder.deleteMany({
      where: { parentId: id },
    });

    return this.prisma.folder.delete({
      where: { id },
    });
  }
}
