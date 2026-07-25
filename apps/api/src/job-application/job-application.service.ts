import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';

import { type ProfileService } from '../profile/profile.service';
import { type CreateJobApplicationDto } from './dto/create-job-application.dto';
import { type UpdateJobApplicationDto } from './dto/update-job-application.dto';

@Injectable()
export class JobApplicationService {
  private readonly logger = new Logger(JobApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
  ) {}

  async create(dto: CreateJobApplicationDto, userId: string) {
    const profile = await this.profileService.findByUserId(userId);
    return this.prisma.jobApplication.create({
      data: {
        profileId: profile.id,
        company: dto.company,
        jobTitle: dto.jobTitle,
        jobDescription: dto.jobDescription,
        location: dto.location,
        salary: dto.salary,
        employmentType: dto.employmentType,
        workMode: dto.workMode,
        resumeId: dto.resumeId,
        coverLetterId: dto.coverLetterId,
        appliedDate: dto.appliedDate ? new Date(dto.appliedDate) : undefined,
        applicationUrl: dto.applicationUrl,
        recruiterContact: dto.recruiterContact,
        notes: dto.notes,
        status: dto.status,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAll(userId: string) {
    const profile = await this.profileService.findByUserId(userId);
    return this.prisma.jobApplication.findMany({
      where: { profileId: profile.id, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const profile = await this.profileService.findByUserId(userId);
    const app = await this.prisma.jobApplication.findFirst({
      where: { id, profileId: profile.id, deletedAt: null },
    });
    if (!app) throw new NotFoundException(`Job application with ID ${id} not found`);
    return app;
  }

  async update(id: string, userId: string, dto: UpdateJobApplicationDto) {
    await this.findOne(id, userId);
    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        ...(dto.company !== undefined && { company: dto.company }),
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
        ...(dto.jobDescription !== undefined && { jobDescription: dto.jobDescription }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.salary !== undefined && { salary: dto.salary }),
        ...(dto.employmentType !== undefined && { employmentType: dto.employmentType }),
        ...(dto.workMode !== undefined && { workMode: dto.workMode }),
        ...(dto.resumeId !== undefined && { resumeId: dto.resumeId }),
        ...(dto.coverLetterId !== undefined && { coverLetterId: dto.coverLetterId }),
        ...(dto.appliedDate !== undefined && { appliedDate: new Date(dto.appliedDate) }),
        ...(dto.applicationUrl !== undefined && { applicationUrl: dto.applicationUrl }),
        ...(dto.recruiterContact !== undefined && { recruiterContact: dto.recruiterContact }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.jobApplication.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
