import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@patorbit/database';
import { CreateImportJobDto } from './dto/create-import-job.dto';
import { StorageService } from '../../platform/storage/storage.service';
import { JsonParser } from './parsers/json-parser';
import { PdfParser } from './parsers/pdf-parser';
import { DocxParser } from './parsers/docx-parser';
import { LinkedinParser } from './parsers/linkedin-parser';

@Injectable()
export class ImportService {
  private parsers: Record<string, { parse: (data: string) => any }>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly jsonParser: JsonParser,
    private readonly pdfParser: PdfParser,
    private readonly docxParser: DocxParser,
    private readonly linkedinParser: LinkedinParser,
  ) {
    this.parsers = {
      json: this.jsonParser,
      pdf: this.pdfParser,
      docx: this.docxParser,
      linkedin: this.linkedinParser,
    };
  }

  async createImportJob(createImportJobDto: CreateImportJobDto) {
    const { sourceType, storageKey, profileId } = createImportJobDto;

    const job = await this.prisma.importJob.create({
      data: {
        sourceType,
        profileId,
        status: 'pending',
        sourceData: { storageKey },
      },
    });

    // Kick off async processing (in a real implementation, queue this)
    this.processImportJob(job.id).catch(err => {
      console.error(`Import job ${job.id} failed:`, err.message);
    });

    return job;
  }

  async processImportJob(jobId: string) {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Import job ${jobId} not found`);
    }

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'processing' },
    });

    try {
      const parser = this.parsers[job.sourceType];
      if (!parser) {
        throw new Error(`No parser available for source type: ${job.sourceType}`);
      }

      const rawData = await this.storageService.get(job.sourceData?.['storageKey'] as string);
      const result = await parser.parse(rawData);

      if (!result.success) {
        throw new Error(result.error || 'Parsing failed');
      }

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          result: result.data as any,
        },
      });
    } catch (error) {
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: error.message,
        },
      });
    }
  }

  async getJob(id: string) {
    const job = await this.prisma.importJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Import job ${id} not found`);
    }
    return job;
  }

  async confirmImport(jobId: string) {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Import job ${id} not found`);
    }
    if (job.status !== 'completed') {
      throw new Error('Import job is not completed yet');
    }

    const result = job.result as any;
    if (!result) {
      throw new Error('Import result is empty');
    }

    const resume = await this.prisma.resume.create({
      data: {
        profileId: job.profileId,
        title: result.title || 'Imported Resume',
        sections: {
          create: (result.sections || []).map((section: any, index: number) => ({
            type: section.type,
            title: section.title,
            sortOrder: index,
            content: section.content || {},
          })),
        },
      },
      include: { sections: true },
    });

    return resume;
  }
}
