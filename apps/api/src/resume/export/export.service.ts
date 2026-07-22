import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';
import { type StorageService } from '@platform/storage';
import { v4 as uuidv4 } from 'uuid';

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

  private async processExport(
    jobId: string,
    resume: any,
    format: string,
  ) {
    try {
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'processing' },
      });

      let storageKey: string;

      if (format === 'json') {
        const content = JSON.stringify(this.buildResumeJson(resume), null, 2);
        storageKey = `resume-exports/${resume.id}/${uuidv4()}.json`;
        await this.storage.upload(storageKey, Buffer.from(content), {
          mimeType: 'application/json',
        });
      } else if (format === 'pdf') {
        // PDF generation placeholder
        storageKey = `resume-exports/${resume.id}/${uuidv4()}.pdf`;
        const placeholder = Buffer.from(`PDF export for resume: ${resume.id}`);
        await this.storage.upload(storageKey, placeholder, {
          mimeType: 'application/pdf',
        });
      } else if (format === 'docx') {
        // DOCX generation placeholder
        storageKey = `resume-exports/${resume.id}/${uuidv4()}.docx`;
        const placeholder = Buffer.from(`DOCX export for resume: ${resume.id}`);
        await this.storage.upload(storageKey, placeholder, {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

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
