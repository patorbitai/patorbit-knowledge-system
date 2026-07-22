
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type CreateSectionDto } from './dto/create-section.dto';
import { type ReorderSectionsDto } from './dto/reorder-sections.dto';
import { type UpdateSectionDto } from './dto/update-section.dto';
import { type SectionService } from './section.service';

@UseGuards(JwtAuthGuard)
@Controller('resumes/:resumeId/sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  create(@Param('resumeId') resumeId: string, @Body() createSectionDto: CreateSectionDto) {
    return this.sectionService.create(resumeId, createSectionDto);
  }

  @Get()
  findAll(@Param('resumeId') resumeId: string) {
    return this.sectionService.findAllByResume(resumeId);
  }

  @Patch(':id')
  update(
    @Param('resumeId') resumeId: string,
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return this.sectionService.update(resumeId, id, updateSectionDto);
  }

  @Patch(':id/toggle')
  toggleVisibility(
    @Param('resumeId') resumeId: string,
    @Param('id') id: string,
    @Body('collapse') collapse?: boolean,
  ) {
    return this.sectionService.toggleVisibility(resumeId, id, collapse);
  }

  @Delete(':id')
  remove(@Param('resumeId') resumeId: string, @Param('id') id: string) {
    return this.sectionService.softDelete(resumeId, id);
  }

  @Patch('reorder')
  reorder(
    @Param('resumeId') resumeId: string,
    @Body() reorderSectionsDto: ReorderSectionsDto,
  ) {
    return this.sectionService.reorder(resumeId, reorderSectionsDto.orders);
  }
}
