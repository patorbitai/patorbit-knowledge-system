// apps/api/src/verification/verification.controller.ts
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import { type VerificationStatus } from '@patorbit/database';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type CreateVerificationDto } from './dto/create-verification.dto';
import { type UpdateVerificationDto } from './dto/update-verification.dto';
import { type VerificationService } from './verification.service';

@ApiTags('verifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('verifications')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post(':evidenceId')
  create(@Param('evidenceId') evidenceId: string, @Body() createVerificationDto: CreateVerificationDto) {
    return this.verificationService.create(evidenceId, createVerificationDto);
  }

  @Get('/evidence/:evidenceId')
  findByEvidence(@Param('evidenceId') evidenceId: string) {
    return this.verificationService.findByEvidence(evidenceId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.verificationService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: VerificationStatus) {
    return this.verificationService.updateStatus(id, status);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVerificationDto: UpdateVerificationDto) {
    return this.verificationService.update(id, updateVerificationDto);
  }
}
