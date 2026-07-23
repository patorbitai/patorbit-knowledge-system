import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';
import { type StorageService } from '@platform/storage';
import { v4 as uuidv4 } from 'uuid';

import { generateDocx } from './generators/docx-generator';
import { generatePdf } from './generators/pdf-generator';

export interface CreateExportJobDto {
  resumeId: string;
  format: 'pdf' | 'docx' | 'json';
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createExportJob(dto: CreateExportJobDto) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: dto.resumeId, deletedAt: null },
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!resume) {
      throw new NotFoundException(`Resume with ID ${dto.resumeId} not found`);
    }

    const job = await this.prisma.exportJob.create({
      data: {
        resumeId: dto.resumeId,
        format: dto.format,
        status: 'pending',
      },
    });

    // Process async in background
    this.processExport(job.id, resume, dto.format).catch((err) =>
      this.logger.error(`Export job ${job.id} failed: ${err.message}`),
    );

    return job;
  }

  async getJob(jobId: string) {
    const job = await this.prisma.exportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Export job ${jobId} not found`);
    return job;
  }

  async getDownloadUrl(jobId: string): Promise<string> {
    const job = await this.getJob(jobId);
    if (job.status !== 'completed') {
      throw new NotFoundException(`Export job ${jobId} is not yet completed`);
    }
    return this.storage.getSignedUrl(job.storageKey!, 3600);
  }

  private async processExport(jobId: string, resume: any, format: string) {
    try {
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'processing' },
      });

      let storageKey: string;
      let buffer: Buffer;
      let mimeType: string;

      switch (format) {
        case 'json':
          buffer = Buffer.from(JSON.stringify(this.buildResumeJson(resume), null, 2));
          storageKey = `resume-exports/${resume.id}/${uuidv4()}.json`;
          mimeType = 'application/json';
          break;
        case 'pdf':
          buffer = await generatePdf(resume);
          storageKey = `resume-exports/${resume.id}/${uuidv4()}.pdf`;
          mimeType = 'application/pdf';
          break;
        case 'docx':
          buffer = await generateDocx(resume);
          storageKey = `resume-exports/${resume.id}/${uuidv4()}.docx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      await this.storage.upload(storageKey, buffer, { mimeType });

      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'completed', storageKey },
      });
      this.logger.log(`Export job ${jobId} completed (${format})`);
    } catch (error) {
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: (error as Error).message,
        },
      });
      throw error;
    }
  }

  private buildResumeJson(resume: any) {
    return {
      title: resume.title,
      status: resume.status,
      sections: (resume.sections || []).map((s: any) => ({
        type: s.type,
        title: s.title,
        content: s.content,
        sortOrder: s.sortOrder,
      })),
      metadata: resume.metadata,
      exportedAt: new Date().toISOString(),
    };
  }
}
