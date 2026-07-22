// apps/api/src/credential/credential.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type CredentialService } from './credential.service';
import { type CreateCredentialDto } from './dto/create-credential.dto';
import { type UpdateCredentialDto } from './dto/update-credential.dto';

@ApiTags('credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credentials')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Post(':evidenceId')
  create(@Param('evidenceId') evidenceId: string, @Body() createCredentialDto: CreateCredentialDto) {
    return this.credentialService.create(evidenceId, createCredentialDto);
  }

  @Get('/evidence/:evidenceId')
  findByEvidence(@Param('evidenceId') evidenceId: string) {
    return this.credentialService.findByEvidence(evidenceId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.credentialService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCredentialDto: UpdateCredentialDto) {
    return this.credentialService.update(id, updateCredentialDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.credentialService.delete(id);
  }
}
