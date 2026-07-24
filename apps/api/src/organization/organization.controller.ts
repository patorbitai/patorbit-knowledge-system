import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';
import { type JwtPayload } from '@patorbit/auth';
import { OrganizationRole } from '@patorbit/database';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type IdentityService } from '../identity/identity.service';
import { type AddMemberDto } from './dto/add-member.dto';
import { type CreateOrganizationDto } from './dto/create-organization.dto';
import { type UpdateOrganizationDto } from './dto/update-organization.dto';
import { type OrganizationService } from './organization.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly identityService: IdentityService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: JwtPayload) {
    return this.organizationService.create(dto, user.sub);
  }

  @Get()
  async findAll() {
    return this.organizationService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.organizationService.softDelete(id, user.sub);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationService.addMember(id, user.sub, dto.profileId, dto.role);
  }

  @Delete(':id/members/:profileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') id: string,
    @Param('profileId') profileId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.organizationService.removeMember(id, user.sub, profileId);
  }

  @Patch(':id/members/:profileId')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('profileId') profileId: string,
    @Body('role') role: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationService.updateMemberRole(id, user.sub, profileId, role);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    // Also protect this read endpoint
    const profile = await this.identityService.findUserById(user.sub);
    if (!profile?.profile?.id) throw new NotFoundException('User profile not found.');
    await this.organizationService.requireRole(id, profile.profile.id, [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
      OrganizationRole.MEMBER,
    ]);
    return this.organizationService.getMembers(id);
  }
}
