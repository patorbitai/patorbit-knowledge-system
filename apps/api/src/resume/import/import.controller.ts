import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type CreateImportJobDto } from './dto/create-import-job.dto';
import { type ImportService } from './import.service';

@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('resume')
  createImportJob(@Body() createImportJobDto: CreateImportJobDto) {
    return this.importService.createImportJob(createImportJobDto);
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.importService.getJob(id);
  }

  @Post('jobs/:id/confirm')
  confirmImport(@Param('id') id: string) {
    return this.importService.confirmImport(id);
  }
}
