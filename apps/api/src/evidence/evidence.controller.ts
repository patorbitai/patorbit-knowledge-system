import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { type JwtPayload } from '@patorbit/auth';
import { type Evidence } from '@patorbit/database';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type IdentityService } from '../identity/identity.service';
import { type AttachFileDto } from './dto/attach-file.dto';
import { type CreateEvidenceDto } from './dto/create-evidence.dto';
import { type UpdateEvidenceDto } from './dto/update-evidence.dto';
import { type EvidenceService } from './evidence.service';

@UseGuards(JwtAuthGuard)
@Controller('evidences')
export class EvidenceController {
  constructor(
    private readonly evidenceService: EvidenceService,
    private readonly identityService: IdentityService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() createEvidenceDto: CreateEvidenceDto,
  ): Promise<Evidence> {
    const profile = await this.identityService.findUserById(user.sub);
    if (!profile?.profile?.id) throw new NotFoundException('User profile not found.');
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
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateEvidenceDto: UpdateEvidenceDto,
  ): Promise<Evidence> {
    const profile = await this.identityService.findUserById(user.sub);
    if (!profile?.profile?.id) throw new NotFoundException('User profile not found.');
    return this.evidenceService.update(id, profile.profile.id, updateEvidenceDto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Evidence> {
    const profile = await this.identityService.findUserById(user.sub);
    if (!profile?.profile?.id) throw new NotFoundException('User profile not found.');
    return this.evidenceService.softDelete(id, profile.profile.id);
  }

  @Post(':id/files')
  async attachFile(
    @CurrentUser() user: JwtPayload,
    @Param('id') evidenceId: string,
    @Body() attachFileDto: AttachFileDto,
  ): Promise<any> {
    const profile = await this.identityService.findUserById(user.sub);
    if (!profile?.profile?.id) throw new NotFoundException('User profile not found.');
    return this.evidenceService.attachFile(evidenceId, profile.profile.id, attachFileDto);
  }

  @Delete(':id/files/:fileId')
  async removeFile(@CurrentUser() user: JwtPayload, @Param('fileId') fileId: string): Promise<any> {
    const profile = await this.identityService.findUserById(user.sub);
    if (!profile?.profile?.id) throw new NotFoundException('User profile not found.');
    return this.evidenceService.removeFile(fileId, profile.profile.id);
  }
}
