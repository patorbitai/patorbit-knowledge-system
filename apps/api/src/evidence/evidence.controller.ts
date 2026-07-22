
import { Body, Controller, Delete, Get, NotFoundException,Param, Patch, Post, UseGuards } from '@nestjs/common';
import { type Evidence } from '@patorbit/database';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type AttachFileDto } from './dto/attach-file.dto';
import { type CreateEvidenceDto } from './dto/create-evidence.dto';
import { type UpdateEvidenceDto } from './dto/update-evidence.dto';
import { type EvidenceService } from './evidence.service';

@UseGuards(JwtAuthGuard)
@Controller('evidences')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  create(@Body() createEvidenceDto: CreateEvidenceDto): Promise<Evidence> {
    return this.evidenceService.create(createEvidenceDto.claimId, createEvidenceDto);
  }

  @Get('claim/:claimId')
  findByClaim(@Param('claimId') claimId: string): Promise<Evidence[]> {
    return this.evidenceService.findByClaim(claimId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Evidence> {
    const evidence = await this.evidenceService.findById(id);
    if (!evidence) {
        throw new NotFoundException(`Evidence with ID ${id} not found`);
    }
    return evidence;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEvidenceDto: UpdateEvidenceDto): Promise<Evidence> {
    return this.evidenceService.update(id, updateEvidenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Evidence> {
    return this.evidenceService.softDelete(id);
  }

  @Post(':id/files')
  attachFile(@Param('id') evidenceId: string, @Body() attachFileDto: AttachFileDto): Promise<any> {
      return this.evidenceService.attachFile(evidenceId, attachFileDto);
  }

  @Delete(':id/files/:fileId')
  removeFile(@Param('fileId') fileId: string): Promise<any> {
      return this.evidenceService.removeFile(fileId);
  }
}
