import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ImportService } from './import.service';
import { CreateImportJobDto } from './dto/create-import-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
