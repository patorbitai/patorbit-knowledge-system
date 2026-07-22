import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type ExportService } from './export.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('resumes/:resumeId/export')
  @HttpCode(HttpStatus.CREATED)
  createExport(
    @Param('resumeId') resumeId: string,
    @Body('format') format: 'pdf' | 'docx' | 'json',
  ) {
    return this.exportService.createExportJob({ resumeId, format });
  }

  @Get('export/jobs/:id')
  getJob(@Param('id') id: string) {
    return this.exportService.getJob(id);
  }

  @Get('export/jobs/:id/download')
  async getDownload(@Param('id') id: string) {
    const url = await this.exportService.getDownloadUrl(id);
    return { url };
  }
}
