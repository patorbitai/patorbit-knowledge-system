import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { type JwtPayload } from '@patorbit/auth';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type IdentityService } from '../identity/identity.service';
import { type CreateWorkspaceDto } from './dto/create-workspace.dto';
import { type UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { type WorkspaceService } from './workspace.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly identityService: IdentityService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.create(dto);
  }

  @Get('organization/:orgId')
  async findByOrganization(@Param('orgId') orgId: string) {
    return this.workspaceService.findByOrganization(orgId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.workspaceService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const profile = await this.identityService.findUserById(user.sub);
    if (!profile?.profile?.id)
      throw new HttpException('User profile not found.', HttpStatus.NOT_FOUND);
    return this.workspaceService.update(id, profile.profile.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const profile = await this.identityService.findUserById(user.sub);
    if (!profile?.profile?.id)
      throw new HttpException('User profile not found.', HttpStatus.NOT_FOUND);
    await this.workspaceService.softDelete(id, profile.profile.id);
  }
}
