
import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, NotFoundException } from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { AttachFileDto } from './dto/attach-file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('evidences')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  create(@Body() createEvidenceDto: CreateEvidenceDto) {
    return this.evidenceService.create(createEvidenceDto.claimId, createEvidenceDto);
  }

  @Get('claim/:claimId')
  findByClaim(@Param('claimId') claimId: string) {
    return this.evidenceService.findByClaim(claimId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const evidence = await this.evidenceService.findById(id);
    if (!evidence) {
        throw new NotFoundException(`Evidence with ID ${id} not found`);
    }
    return evidence;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEvidenceDto: UpdateEvidenceDto) {
    return this.evidenceService.update(id, updateEvidenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evidenceService.softDelete(id);
  }

  @Post(':id/files')
  attachFile(@Param('id') evidenceId: string, @Body() attachFileDto: AttachFileDto) {
      return this.evidenceService.attachFile(evidenceId, attachFileDto);
  }

  @Delete(':id/files/:fileId')
  removeFile(@Param('fileId') fileId: string) {
      return this.evidenceService.removeFile(fileId);
  }
}
