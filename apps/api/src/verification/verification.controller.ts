// apps/api/src/verification/verification.controller.ts
import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { VerificationStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
